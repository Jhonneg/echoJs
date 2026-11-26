# APP04 manual checklist (owner)

Fill in **Result** with what you actually saw (OK / problem + one line). Use only audio you're permitted to use. Nothing here is recorded or uploaded. Items left blank stay MANUAL in the [support matrix](SUPPORT_MATRIX.md).

| # | Where | Steps | Expected | Result |
|---|---|---|---|---|
| 1 | Chrome or Brave desktop, normal window | `npm run dev`, open the page, **Share a tab**, choose a tab playing music, tick **Share tab audio** | Status "Listening to your shared tab."; you can hear the source tab; the landscape reacts | |
| 2 | Same | In Chrome's sharing bar, click **Stop sharing** | "Browser sharing ended…", **Retry sharing** offered; nothing keeps running | |
| 3 | Same | Share a tab, then switch to another app or tab for about 30 s and come back | Still connected; the landscape reacts again within a second or two | |
| 4 | Same | Play a local file, switch landscapes quickly 10 times | Music keeps playing; brief restart of music-driven motion after a slow switch is known (APP03) | |
| 5 | Firefox desktop (if available) | Open the page, play a local file, then try **Share a tab** | File plays and landscapes render. Note the exact sharing message. Expected: no tab audio; we suspect the message is misleading | |
| 6 | Safari macOS (if available) | Same as 5 | Same as 5 | |
| 7 | Android phone | Open the page over HTTPS or LAN, open a local audio file, Play, open Options, Pause | Message says tab sharing isn't available; file plays; controls work by touch; landscape renders smoothly | |
| 8 | iPhone / iPad | Same as 7 | Same as 7 | |
| 9 | Linux desktop with Orca screen reader | Tab through the controls, share/cancel, open a bad file | Controls are named; status changes are spoken; failures are spoken promptly | |
| 10 | Chrome DevTools → Network → Slow 4G | Reload, then switch to each landscape | Bloom appears first; "Loading …" may show briefly; no errors | |
| 11 | Any | Turn on the OS "reduce motion" setting and reload | Landscapes hold still; controls still work | |
