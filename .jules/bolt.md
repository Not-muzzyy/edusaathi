## 2024-05-24 - O(n²) Calendar Filtering Pattern
**Learning:** Found an `O(N * Days)` nested loop bottleneck during calendar rendering in the `StudyPlanner` component. Specifically, rendering each day in the month view filters the entire `tasks` array (up to N tasks) `Days` number of times (`30+` times per render) using `.filter()`. This leads to poor performance on renders with many tasks.
**Action:** Always map array data to an `O(1)` dictionary lookup (`Record<string, Task[]>`) using `useMemo` before iterating and querying the array in nested loops (like days in a month calendar).
