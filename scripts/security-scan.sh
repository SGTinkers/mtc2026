#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC} $1"; }
fail() { echo -e "${RED}FAIL${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}WARN${NC} $1"; }

echo -e "${BOLD}Running security scans...${NC}\n"

# 1. Dependency audit
echo -e "${BOLD}[1/4] Dependency audit${NC}"
if bun audit --audit-level critical; then
  pass "bun audit"
else
  fail "bun audit found vulnerabilities"
fi
echo

# 2. Secret detection
echo -e "${BOLD}[2/4] Secret detection${NC}"
if ! command -v gitleaks &> /dev/null; then
  warn "gitleaks not installed. Install: https://github.com/gitleaks/gitleaks#installing"
  warn "  brew install gitleaks  OR  go install github.com/gitleaks/gitleaks/v8@latest"
else
  if gitleaks detect --source . --verbose; then
    pass "gitleaks"
  else
    fail "gitleaks found secrets"
  fi
fi
echo

# 3. SAST
echo -e "${BOLD}[3/4] SAST (Semgrep)${NC}"
if ! command -v semgrep &> /dev/null; then
  warn "semgrep not installed. Install: https://semgrep.dev/docs/getting-started/"
  warn "  pip install semgrep  OR  brew install semgrep"
else
  if semgrep scan --config p/owasp-top-ten src/; then
    pass "semgrep"
  else
    fail "semgrep found issues"
  fi
fi
echo

# 4. Oxlint security rules
echo -e "${BOLD}[4/4] Oxlint security + correctness${NC}"
if bunx oxlint --deny-warnings -D security -D correctness src/; then
  pass "oxlint"
else
  fail "oxlint found issues"
fi
echo

echo -e "${GREEN}${BOLD}All security scans passed!${NC}"
