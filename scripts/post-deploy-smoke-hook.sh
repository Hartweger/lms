#!/usr/bin/env bash
# Claude Code PostToolUse hook (matcher: Bash).
# Posle `vercel --prod` deploya pokreće smoke test i prijavljuje rezultat modelu
# (additionalContext) + upozorava korisnika ako padne. Za sve druge Bash komande
# je no-op. Uvek izlazi 0 (ne blokira tok — samo informiše).
set -uo pipefail
LMS_DIR="/Users/natasahartweger/Documents/Claude/sajt/LMS/lms"

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"

# Reaguj samo na produkcioni deploy (mora sadržati i "vercel" i "--prod").
case "$cmd" in
  *vercel*--prod*|*--prod*vercel*) ;;
  *) exit 0 ;;
esac

out="$(cd "$LMS_DIR" && node scripts/smoke-deploy.mjs 2>&1)"; rc=$?

if [ "$rc" -eq 0 ]; then
  jq -nc --arg o "$out" '{
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("Post-deploy smoke test PROŠAO (sve rute 200):\n" + $o)
    }
  }'
else
  jq -nc --arg o "$out" --arg rc "$rc" '{
    systemMessage: "⚠️ Post-deploy smoke test PAO — proveri produkciju odmah!",
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("Post-deploy smoke test PAO (exit " + $rc + "):\n" + $o)
    }
  }'
fi
exit 0
