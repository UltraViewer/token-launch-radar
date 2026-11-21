# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/UltraViewer/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/UltraViewer/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: it reads a sealed DefiLlama snapshot of 758 protocols, ranks the pre-token ones by an implied value derived from their TVL, seven-day growth and time running with no token, and shows a reader how to farm each one — a ranked board, a detail view per protocol, and filters, all offline.

## Run it

```sh
node main.ts
```

It reads `/input/snapshot.json` (or `MAKEFUN_INPUT_DIR`), writes the ranked board to `/output/board.json`, the dashboard data beside the page, copies `dashboard/` and `screenshots/` to `/output`, and writes `/output/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=crwhvsxm&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
