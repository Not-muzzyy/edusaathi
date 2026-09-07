## 2024-05-24 - [Parallelize Independent Fetch Calls]
**Learning:** React initial load speed can be significantly dragged down by independent API calls running sequentially due to back-to-back awaits.
**Action:** Use Promise.all to fetch them simultaneously.
