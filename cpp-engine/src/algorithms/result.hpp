
#pragma once
#include <vector>
#include <deque>
using namespace std;

class result
{
public:
    bool found = false;

    vector<int> visitOrder;
    deque<int> path;

    long long algorithmRuntimeUs = 0;
    int totalDist = 0;
};