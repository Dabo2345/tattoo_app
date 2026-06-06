#!/usr/bin/env bash
# ============================================================
# pr-report.sh — PR Review Report Generator
# Claude Code PreToolUse hook — intercepta 'gh pr create'
#
# Genera un informe detallado del PR para revisión manual
# antes de que se suba a GitHub.
#
# Comportamiento:
#   • Si el comando NO es 'gh pr create' → exit 0 (no hace nada)
#   • Si el comando ES 'gh pr create'    → muestra informe + exit 2 (bloquea)
# ============================================================

# ─── Leer stdin (JSON del hook de Claude Code) ───────────────
INPUT=$(cat)

# ─── Extraer el comando de la tool call ──────────────────────
COMMAND=$(echo "$INPUT" | node -e "
  let d = '';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try {
      const o = JSON.parse(d);
      // Claude Code pasa tool_input.command para el Bash tool
      const cmd = o.tool_input?.command || o.input?.command || '';
      console.log(cmd);
    } catch (e) {
      console.log('');
    }
  });
" 2>/dev/null || echo "")

# ─── Solo actuar si es una creación de PR ────────────────────
if ! echo "$COMMAND" | grep -qE "gh pr create"; then
  exit 0
fi

# ─── Colores ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ─── Datos de contexto ────────────────────────────────────────
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
ISSUE_ID=$(echo "$BRANCH" | grep -oE '/([0-9]+)-' | grep -oE '[0-9]+' | head -1 || echo "")
BASE_BRANCH="develop"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//' | sed 's/\.git$//' || echo "")

# ─── Header ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║        📋  PR REVIEW REPORT — INFORME PREVIO A SUBIR            ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${DIM}Repositorio:${NC}  ${REPO:-desconocido}"
echo -e "${DIM}Rama origen:${NC}  ${BRANCH}"
echo -e "${DIM}Rama destino:${NC} ${BASE_BRANCH}"
echo -e "${DIM}Timestamp:${NC}    ${TIMESTAMP}"
if [ -n "$ISSUE_ID" ]; then
  echo -e "${DIM}Issue:${NC}        #${ISSUE_ID}"
fi
echo ""

# ─── SECCIÓN 1: Commits ───────────────────────────────────────
echo -e "${BOLD}${CYAN}━━━ [1/6] COMMITS EN ESTA RAMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
COMMITS=$(git log "${BASE_BRANCH}..HEAD" --oneline 2>/dev/null)
COMMIT_COUNT=$(echo "$COMMITS" | grep -c "." 2>/dev/null || echo "0")
echo -e "${BOLD}Total:${NC} ${COMMIT_COUNT} commit(s)"
echo ""
if [ -n "$COMMITS" ]; then
  echo "$COMMITS" | while IFS= read -r line; do
    echo "  • $line"
  done
else
  echo -e "  ${RED}⚠  No se encontraron commits nuevos respecto a ${BASE_BRANCH}${NC}"
fi
echo ""

# ─── SECCIÓN 2: Archivos modificados ─────────────────────────
echo -e "${BOLD}${CYAN}━━━ [2/6] ARCHIVOS MODIFICADOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
FILES_STATUS=$(git diff "${BASE_BRANCH}..HEAD" --name-status 2>/dev/null)
CHANGED_FILES=$(git diff "${BASE_BRANCH}..HEAD" --name-only 2>/dev/null)
FILE_COUNT=$(echo "$CHANGED_FILES" | grep -c "." 2>/dev/null || echo "0")
echo -e "${BOLD}Total:${NC} ${FILE_COUNT} archivo(s)"
echo ""
if [ -n "$FILES_STATUS" ]; then
  echo "$FILES_STATUS" | while IFS=$'\t' read -r status file rest; do
    case "$status" in
      A)  echo -e "  ${GREEN}[NUEVO]      ${NC} $file" ;;
      M)  echo -e "  ${YELLOW}[MODIFICADO] ${NC} $file" ;;
      D)  echo -e "  ${RED}[ELIMINADO]  ${NC} $file" ;;
      R*) echo -e "  ${CYAN}[RENOMBRADO] ${NC} $file → $rest" ;;
      *)  echo   "  [${status}]         $file" ;;
    esac
  done
else
  echo -e "  ${DIM}Sin cambios detectados.${NC}"
fi
echo ""

# ─── SECCIÓN 3: Estadísticas ─────────────────────────────────
echo -e "${BOLD}${CYAN}━━━ [3/6] ESTADÍSTICAS DEL DIFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
DIFF_STAT=$(git diff "${BASE_BRANCH}..HEAD" --stat 2>/dev/null | tail -1)
INSERTIONS=$(git diff "${BASE_BRANCH}..HEAD" --shortstat 2>/dev/null | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
DELETIONS=$(git diff "${BASE_BRANCH}..HEAD" --shortstat 2>/dev/null | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
echo -e "  ${GREEN}+${INSERTIONS} líneas añadidas${NC}   ${RED}-${DELETIONS} líneas eliminadas${NC}"
[ -n "$DIFF_STAT" ] && echo -e "  ${DIM}${DIFF_STAT}${NC}"
echo ""

# ─── SECCIÓN 4: Tests ────────────────────────────────────────
echo -e "${BOLD}${CYAN}━━━ [4/6] COBERTURA DE TESTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$" || echo "")
NON_TEST_SRC=$(echo "$CHANGED_FILES" | grep "^src/" | grep -vE "\.(test|spec)\." || echo "")

if [ -n "$TEST_FILES" ]; then
  TEST_COUNT=$(echo "$TEST_FILES" | grep -c "." 2>/dev/null || echo "0")
  echo -e "${GREEN}  ✓ ${TEST_COUNT} archivo(s) de test incluidos:${NC}"
  echo "$TEST_FILES" | while IFS= read -r f; do
    echo -e "    ${GREEN}✓${NC} $f"
  done
else
  echo -e "${RED}  ✗ No se detectaron archivos de test en este PR${NC}"
  if [ -n "$NON_TEST_SRC" ]; then
    echo -e "${YELLOW}    Archivos src/ sin test correspondiente:${NC}"
    echo "$NON_TEST_SRC" | while IFS= read -r f; do
      echo "    - $f"
    done
  fi
fi
echo ""

# ─── SECCIÓN 5: Issue DOC + Criterios de aceptación ─────────
echo -e "${BOLD}${CYAN}━━━ [5/6] ISSUE DOC & CRITERIOS DE ACEPTACIÓN ━━━━━━━━━━━━━━━━━━${NC}"
if [ -n "$ISSUE_ID" ]; then
  PADDED_ID=$(printf "%03d" "$ISSUE_ID" 2>/dev/null || echo "$ISSUE_ID")
  ISSUE_DOC=$(find ./issues-docs -maxdepth 1 -name "${PADDED_ID}-*.md" 2>/dev/null | head -1)
  if [ -n "$ISSUE_DOC" ]; then
    echo -e "${DIM}Documento:${NC} $ISSUE_DOC"
    echo ""

    # Criterios de aceptación
    CRITERIA=$(awk '/^## Criterios de aceptación/,/^---/' "$ISSUE_DOC" 2>/dev/null | grep "^\- \[" || echo "")
    if [ -n "$CRITERIA" ]; then
      echo -e "${BOLD}Criterios de aceptación:${NC}"
      echo "$CRITERIA" | while IFS= read -r line; do
        if echo "$line" | grep -q "\[x\]"; then
          echo -e "  ${GREEN}$line${NC}"
        else
          echo -e "  ${YELLOW}$line${NC}"
        fi
      done
      echo ""
    fi

    # Definition of Done
    DOD=$(awk '/^## Definition of Done/,0' "$ISSUE_DOC" 2>/dev/null | grep "^\- \[" || echo "")
    if [ -n "$DOD" ]; then
      echo -e "${BOLD}Definition of Done:${NC}"
      echo "$DOD" | while IFS= read -r line; do
        if echo "$line" | grep -q "\[x\]"; then
          echo -e "  ${GREEN}$line${NC}"
        else
          echo -e "  ${YELLOW}$line${NC}"
        fi
      done
      echo ""
    fi
  else
    echo -e "  ${DIM}No se encontró ISSUE DOC para #${ISSUE_ID} en /issues-docs/${NC}"
    echo ""
  fi
else
  echo -e "  ${DIM}No se detectó número de issue en el nombre de la rama.${NC}"
  echo -e "  ${DIM}Formato esperado: feature/004-nombre-issue${NC}"
  echo ""
fi

# ─── SECCIÓN 6: Alertas de calidad ───────────────────────────
echo -e "${BOLD}${CYAN}━━━ [6/6] ALERTAS DE CALIDAD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
ALERTS=0

# Archivos .env
if echo "$CHANGED_FILES" | grep -qE "^\.env"; then
  echo -e "${RED}  ⚠  ALERTA CRÍTICA: Cambios en archivos .env detectados${NC}"
  ALERTS=$((ALERTS + 1))
fi

# console.log en src/
CONSOLE_LOGS=$(git diff "${BASE_BRANCH}..HEAD" -- "src/" 2>/dev/null | grep "^+" | grep -v "^+++" | grep "console\.log" | head -5 || echo "")
if [ -n "$CONSOLE_LOGS" ]; then
  echo -e "${YELLOW}  ⚠  console.log detectados en src/:${NC}"
  echo "$CONSOLE_LOGS" | while IFS= read -r line; do
    echo "    $line"
  done
  ALERTS=$((ALERTS + 1))
fi

# Tipos 'any' explícitos
ANY_TYPES=$(git diff "${BASE_BRANCH}..HEAD" -- "*.ts" "*.tsx" 2>/dev/null | grep "^+" | grep -v "^+++" | grep -E ": any[^A-Za-z]" | head -5 || echo "")
if [ -n "$ANY_TYPES" ]; then
  echo -e "${YELLOW}  ⚠  Tipos 'any' explícitos detectados:${NC}"
  echo "$ANY_TYPES" | while IFS= read -r line; do
    echo "    $line"
  done
  ALERTS=$((ALERTS + 1))
fi

# TODO/FIXME
TODOS=$(git diff "${BASE_BRANCH}..HEAD" -- "src/" 2>/dev/null | grep "^+" | grep -v "^+++" | grep -iE "TODO|FIXME|HACK|XXX" | head -5 || echo "")
if [ -n "$TODOS" ]; then
  echo -e "${YELLOW}  ⚠  TODO/FIXME encontrados:${NC}"
  echo "$TODOS" | while IFS= read -r line; do
    echo "    $line"
  done
  ALERTS=$((ALERTS + 1))
fi

# Commits directos no convencionales
BAD_COMMITS=$(git log "${BASE_BRANCH}..HEAD" --oneline 2>/dev/null | grep -vE "^[a-f0-9]+ (feat|fix|chore|docs|test|refactor|style|ci|build|perf|revert)(\(.+\))?:" || echo "")
if [ -n "$BAD_COMMITS" ]; then
  echo -e "${YELLOW}  ⚠  Commits sin formato convencional:${NC}"
  echo "$BAD_COMMITS" | while IFS= read -r line; do
    echo "    • $line"
  done
  ALERTS=$((ALERTS + 1))
fi

if [ "$ALERTS" -eq 0 ]; then
  echo -e "${GREEN}  ✓ Sin alertas detectadas${NC}"
fi
echo ""

# ─── Footer: decisión ─────────────────────────────────────────
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║   ⏸  PR BLOQUEADA — REVISIÓN MANUAL REQUERIDA                   ║${NC}"
echo -e "${BOLD}${BLUE}║                                                                  ║${NC}"
echo -e "${BOLD}${BLUE}║   Revisa el informe y responde:                                  ║${NC}"
echo -e "${BOLD}${BLUE}║     ✅  'aprueba el PR'   → se crea la PR en GitHub              ║${NC}"
echo -e "${BOLD}${BLUE}║     ✏️   'cambia X'        → se aplica el ajuste primero          ║${NC}"
echo -e "${BOLD}${BLUE}║     ❌  'cancela el PR'   → se descarta la operación             ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Exit 2 → Claude Code bloquea la tool call y muestra este output como motivo
exit 2
