const LAYOUT_HEADER_SIZE = 16;
const RUN_HEADER_SIZE = 40;
export const GRID_DIMENSIONS = 101;

export const CELL_ROLE = Object.freeze({ EMPTY: 0, WALL: 1, START: 2, END: 3 });
export const RUN_DETAIL = Object.freeze({ FULL: 1, METRICS: 2 });
const ALGORITHM_CODE = Object.freeze({ bfs: 1, dijkstra: 2, astar: 3 });

const validGridShape = (gridDims, gridSize) =>
  gridDims === GRID_DIMENSIONS && gridSize === GRID_DIMENSIONS * GRID_DIMENSIONS;

const requireEnvelope = (buffer) => {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("Expected a binary API response.");
  return new DataView(buffer);
};

const hasMagic = (view, magic) =>
  magic.split("").every((character, index) => view.getUint8(index) === character.charCodeAt(0));

const readHeader = (view, magic, type, minimumSize) => {
  if (view.byteLength < minimumSize || !hasMagic(view, magic)) throw new Error("Invalid binary envelope.");
  if (view.getUint16(4, true) !== 2 || view.getUint16(6, true) !== type) {
    throw new Error("Unsupported binary envelope version.");
  }

  const gridDims = view.getUint32(8, true);
  const gridSize = view.getUint32(12, true);
  if (!validGridShape(gridDims, gridSize)) throw new Error("Invalid binary grid shape.");
  return { gridDims, gridSize };
};

export const decodeLayout = (buffer, layoutId) => {
  if (typeof layoutId !== "string" || layoutId.length === 0) throw new Error("Layout response is missing its layout ID.");
  const view = requireEnvelope(buffer);
  const { gridDims, gridSize } = readHeader(view, "WFL2", 1, LAYOUT_HEADER_SIZE);
  if (view.byteLength !== LAYOUT_HEADER_SIZE + gridSize * 2) throw new Error("Invalid Layout envelope length.");

  const roles = new Uint8Array(gridSize);
  const weights = new Uint8Array(gridSize);
  let startCount = 0;
  let endCount = 0;
  for (let index = 0; index < gridSize; index += 1) {
    const role = view.getUint8(LAYOUT_HEADER_SIZE + index * 2);
    const weight = view.getUint8(LAYOUT_HEADER_SIZE + index * 2 + 1);
    if (role > CELL_ROLE.END || weight < 1) throw new Error("Invalid Layout cell data.");
    roles[index] = role;
    weights[index] = weight;
    if (role === CELL_ROLE.START) startCount += 1;
    if (role === CELL_ROLE.END) endCount += 1;
  }
  if (startCount !== 1 || endCount !== 1) throw new Error("Layout must contain one start and one end cell.");
  return { id: layoutId, gridDims, gridSize, roles, weights };
};

export const decodeRun = (buffer, expectedLayout, expectedAlgorithm) => {
  if (!expectedLayout?.id || !Number.isInteger(expectedLayout.gridDims) || !Number.isInteger(expectedLayout.gridSize)) {
    throw new Error("A Layout is required to decode a run.");
  }
  const view = requireEnvelope(buffer);
  const { gridDims, gridSize } = readHeader(view, "WFR2", 2, RUN_HEADER_SIZE);
  const algorithm = view.getUint8(16);
  const detail = view.getUint8(17);
  const found = view.getUint8(18);
  const reserved = view.getUint8(19);
  const runtimeUs = view.getBigUint64(20, true);
  const totalDistance = view.getUint32(28, true);
  const visitCount = view.getUint32(32, true);
  const pathLength = view.getUint32(36, true);

  if (
    gridDims !== expectedLayout.gridDims || gridSize !== expectedLayout.gridSize ||
    algorithm !== expectedAlgorithm || ![RUN_DETAIL.FULL, RUN_DETAIL.METRICS].includes(detail) ||
    ![0, 1].includes(found) || reserved !== 0 || runtimeUs > BigInt(Number.MAX_SAFE_INTEGER) ||
    (detail === RUN_DETAIL.METRICS && (visitCount !== 0 || pathLength !== 0)) ||
    (detail === RUN_DETAIL.FULL && ((found === 0 && pathLength !== 0) || (found === 1 && pathLength === 0))) ||
    view.byteLength !== RUN_HEADER_SIZE + (visitCount + pathLength) * 4
  ) throw new Error("Invalid Pathfinding run envelope.");

  const visitOrder = new Uint32Array(visitCount);
  const path = new Uint32Array(pathLength);
  for (let index = 0; index < visitCount + pathLength; index += 1) {
    const cellIndex = view.getUint32(RUN_HEADER_SIZE + index * 4, true);
    if (cellIndex >= gridSize) throw new Error("Pathfinding run contains an invalid cell index.");
    if (index < visitCount) visitOrder[index] = cellIndex;
    else path[index - visitCount] = cellIndex;
  }
  return { layoutId: expectedLayout.id, algorithm, detail, found: found === 1, runtimeUs: Number(runtimeUs), totalDistance, visitOrder, path };
};

const parseError = async (response) => {
  try { return (await response.json()).error; } catch { return null; }
};

export const fetchLayout = async (request = fetch) => {
  const response = await request("/api/layout");
  if (!response.ok) throw new Error((await parseError(response)) ?? "Layout request failed.");
  return decodeLayout(await response.arrayBuffer(), response.headers.get("X-Layout-Id"));
};

export const generateLayout = async (request = fetch) => {
  const response = await request("/api/layout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error((await parseError(response)) ?? "Layout request failed.");
  return decodeLayout(await response.arrayBuffer(), response.headers.get("X-Layout-Id"));
};

export const fetchRun = async (layout, algorithm, request = fetch) => {
  const expectedAlgorithm = ALGORITHM_CODE[algorithm];
  if (!expectedAlgorithm) throw new Error("Unknown Pathfinding algorithm.");
  const response = await request(`/api/runs/${algorithm}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layoutId: layout.id, detail: "full" }),
  });
  if (response.status === 409 || response.headers.get("X-Layout-Id") !== layout.id) {
    return { stale: true, layout: await fetchLayout(request) };
  }
  if (!response.ok) throw new Error((await parseError(response)) ?? "Pathfinding request failed.");
  return { stale: false, run: decodeRun(await response.arrayBuffer(), layout, expectedAlgorithm) };
};
