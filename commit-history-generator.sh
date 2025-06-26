#!/bin/bash

GITHUB_REPO_URL="https://github.com/your-username/your-repo-name.git"
BRANCH="main"

rm -rf .git
git init

git config user.name "Your Name"
git config user.email "your@email.com"

touch fake-progress.js
echo "// initial" >> fake-progress.js
git add .
git commit -m "Initial commit"

for i in {30..1}
do
  export GIT_AUTHOR_DATE="$(date -d "$i days ago 10:$((RANDOM % 60)):00" "+%Y-%m-%dT%H:%M:%S")"
  export GIT_COMMITTER_DATE="$GIT_AUTHOR_DATE"

  echo "// day $i progress" >> fake-progress.js
  git add fake-progress.js
  git commit -m "Work on feature - day $i"
done

git branch -M $BRANCH
git remote add origin "$GITHUB_REPO_URL"
git push -u origin $BRANCH --force

echo "✅ Project pushed to GitHub with fake activity over 30 days!"
