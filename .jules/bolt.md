## 2026-09-06 - O(N²) Calendar Grid Rendering Bottleneck
**Learning:** In React components that render large grids (like calendars), avoid repeatedly mapping or filtering over the same array for every grid cell inside the render cycle. In the `StudyPlanner` component, `tasks.filter()` was being called inside the mapping for each day in a month, leading to O(N * M) (where N is days in a month, M is total tasks) time complexity during renders, causing performance degradation as tasks accumulated.
**Action:** Use `useMemo` to construct an O(N) lookup hash map (e.g. `Map<string, Task[]>`) grouped by date string once per tasks array update, then perform O(1) lookups for each grid cell.
## 2023-11-20 - O(N) Array Reduction Rendering Bottleneck
**Learning:** In React components that render dashboards with aggregated metrics (like average accuracy or overall mastery), avoid repeatedly running O(N) array reductions inside the render cycle. In the `StudentDashboard` component, `attempts.reduce()` and `mastery.reduce()` were being called for every render, causing performance degradation as the number of attempts and topics grew.
**Action:** Use `useMemo` to cache the results of O(N) array reductions, so they are only recalculated when the underlying data (`attempts` or `mastery`) actually changes.
## 2026-09-07 - N+1 Query in Bulk Updates
**Learning:** In backend endpoints performing bulk status changes (like rescheduling multiple tasks), avoid fetching the target IDs with a `SELECT` and then looping in application logic to execute `UPDATE` statements for each item. This creates an N+1 query bottleneck.
**Action:** Use a single bulk `UPDATE` SQL statement specifying the exact criteria in the `WHERE` clause, and use `cursor.rowcount` to determine the number of updated records.
