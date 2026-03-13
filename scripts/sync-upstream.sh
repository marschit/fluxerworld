#!/bin/bash
set -e

echo "=== RedFlux Upstream Sync ==="

# Ensure upstream remote exists
if ! git remote get-url upstream &>/dev/null; then
    echo "Adding upstream remote..."
    git remote add upstream https://github.com/fluxerapp/fluxer.git
fi

echo "Fetching upstream..."
git fetch upstream

# Check for changes
UPSTREAM_HEAD=$(git rev-parse upstream/main)
MERGE_BASE=$(git merge-base HEAD upstream/main)

if [ "$UPSTREAM_HEAD" = "$MERGE_BASE" ]; then
    echo "Already up to date with upstream!"
    exit 0
fi

NEW_COMMITS=$(git log --oneline "$MERGE_BASE".."$UPSTREAM_HEAD" | wc -l | tr -d ' ')
echo "Found $NEW_COMMITS new upstream commit(s)"
echo ""
git log --oneline "$MERGE_BASE".."$UPSTREAM_HEAD" | head -20
echo ""

read -p "Merge upstream changes? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

if git merge upstream/main --no-edit; then
    echo ""
    echo "Merge successful!"
    echo "Run 'git push' to update the remote."
else
    echo ""
    echo "Merge has conflicts! Resolve them manually, then:"
    echo "  git add ."
    echo "  git commit"
    echo "  git push"
fi
