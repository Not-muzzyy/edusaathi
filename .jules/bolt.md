## 2026-09-06 - O(N²) Calendar Grid Rendering Bottleneck
**Learning:** In React components that render large grids (like calendars), avoid repeatedly mapping or filtering over the same array for every grid cell inside the render cycle. In the `StudyPlanner` component, `tasks.filter()` was being called inside the mapping for each day in a month, leading to O(N * M) (where N is days in a month, M is total tasks) time complexity during renders, causing performance degradation as tasks accumulated.
**Action:** Use `useMemo` to construct an O(N) lookup hash map (e.g. `Map<string, Task[]>`) grouped by date string once per tasks array update, then perform O(1) lookups for each grid cell.
## 2023-11-20 - O(N) Array Reduction Rendering Bottleneck
**Learning:** In React components that render dashboards with aggregated metrics (like average accuracy or overall mastery), avoid repeatedly running O(N) array reductions inside the render cycle. In the `StudentDashboard` component, `attempts.reduce()` and `mastery.reduce()` were being called for every render, causing performance degradation as the number of attempts and topics grew.
**Action:** Use `useMemo` to cache the results of O(N) array reductions, so they are only recalculated when the underlying data (`attempts` or `mastery`) actually changes.

## 2024-05-18 - O(N) Database Queries in Topic Progress Fetching
**Learning:** In the `update_progress_from_result` function, `get_topic_progress` was fetching all progress records into a python list and performing an O(N) search to find a specific topic. This led to O(N) time complexity and memory overhead proportional to the user's progress history size.
**Action:** Replaced the full-table fetch with `get_specific_topic_progress` to query the specific topic by passing the `subject` and `topic` in the `WHERE` clause, turning the operation into an O(1) database lookup.
