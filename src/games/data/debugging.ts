import type { TypingQuestion } from "../typing-quiz-engine.js";

// "Spot the bug" style debugging questions — short original snippets with a
// planted bug, answer is the short fix/cause (typed, not multiple choice).
// Organized by category per the roadmap: JavaScript, Python, SQL, Git,
// Algorithms, Linux, Regex, HTTP, Docker.

export const jsDebugQuestions: TypingQuestion[] = [
  { prompt: "for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); } logs 3,3,3 not 0,1,2. Which keyword instead of 'var' fixes it?", answers: ["let"] },
  { prompt: "if (user.name = 'Bob') { ... } always runs, and overwrites user.name. What's the bug, in one word (the wrong operator)?", answers: ["=", "assignment"] },
  { prompt: "const arr = [1,2,3]; arr.forEach(n => { if (n === 2) return; }); — forEach can't be stopped early. What method should replace forEach to actually break out on a match?", answers: ["find", "some", "for", "for...of"] },
  { prompt: "async function get() { const res = fetch(url); return res.json(); } — this throws 'res.json is not a function'. What keyword is missing before fetch(url)?", answers: ["await"] },
  { prompt: "function add(a, b) { return a + b } add('2', 3) returns '23' not 5. What's the underlying cause, in one word?", answers: ["coercion", "concatenation", "string"] },
  { prompt: "[1,2,3].map(n => n * 2).length is 3, correct — but a common bug is doing arr.filter(n => n).map(...).forEach(...) and expecting forEach to return a value. What does forEach always return?", answers: ["undefined"] },
  { prompt: "try { JSON.parse(badInput) } — nothing catches the error. What block is missing after the try?", answers: ["catch"] },
];

export const pythonDebugQuestions: TypingQuestion[] = [
  { prompt: "def add_item(item, items=[]): items.append(item); return items — calling this twice with no args gives a growing list, not two separate lists. What's the bug called (the mutable thing used as default)?", answers: ["mutable default", "mutable default argument"] },
  { prompt: "for i in range(5): print(i) prints 0 1 2 3 4. To print 1 2 3 4 5 instead, what should range's arguments be? (as typed, e.g. '1, 6')", answers: ["1, 6", "1,6", "range(1, 6)"] },
  { prompt: "if x = 5: — this is a syntax error in Python. What operator should '=' be replaced with for a comparison?", answers: ["==", "double equals"] },
  { prompt: "print('Value: ' + 5) throws a TypeError. What builtin function should wrap the 5 to fix it?", answers: ["str"] },
  { prompt: "a_list = [1,2,3]; b_list = a_list; b_list.append(4) — a_list also gets 4 added. Why, in one word (what b_list actually is)?", answers: ["reference", "alias"] },
  { prompt: "except: pass silently swallows every error including typos. What should follow 'except' to only catch a specific error type, e.g. ValueError?", answers: ["exception", "valueerror", "except valueerror"] },
];

export const sqlDebugQuestions: TypingQuestion[] = [
  { prompt: "SELECT * FROM orders WHERE customer_id = NULL; returns zero rows even for NULL customer_ids. What operator should replace '=' for NULL comparisons?", answers: ["is"] },
  { prompt: "SELECT department, COUNT(*) FROM employees; fails without GROUP BY. What clause is missing, followed by the column name?", answers: ["group by department", "group by"] },
  { prompt: "DELETE FROM users; with no WHERE clause deletes every row. What clause should be added to target specific rows?", answers: ["where"] },
  { prompt: "SELECT name FROM users WHERE age > 18 AND age < 18; returns nothing — the condition is impossible. What logical word turns this into a sensible range check when combined differently: age < 18 ___ age > 65?", answers: ["or"] },
  { prompt: "A query using WHERE on a non-indexed column of a huge table is slow. What should be created on that column to speed it up?", answers: ["index"] },
];

export const gitDebugQuestions: TypingQuestion[] = [
  { prompt: "You committed a secret API key. What git command lets you edit the most recent commit's message and contents before pushing?", answers: ["git commit --amend"] },
  { prompt: "git push fails with 'rejected, non-fast-forward'. What command should you run before pushing again to incorporate the remote changes?", answers: ["git pull"] },
  { prompt: "You're on the wrong branch and made uncommitted changes you want to keep on the correct branch. What command temporarily shelves them?", answers: ["git stash"] },
  { prompt: "A merge has conflicts. After manually fixing the conflicted files, what two words finish the merge (git ___)?", answers: ["add", "git add"] },
  { prompt: "You want to see which commit introduced a specific line — what git command shows line-by-line commit history?", answers: ["git blame"] },
];

export const algorithmsDebugQuestions: TypingQuestion[] = [
  { prompt: "def factorial(n): return n * factorial(n-1) — this never terminates. What's missing (the condition that should stop the recursion)?", answers: ["base case"] },
  { prompt: "A binary search that never updates 'high' or 'low' correctly loops forever. What's this bug generally called?", answers: ["infinite loop"] },
  { prompt: "A recursive function without memoization recalculating fib(n) repeatedly is what complexity class instead of linear?", answers: ["exponential"] },
  { prompt: "Using a nested loop (loop inside a loop) over the same array to check for duplicates is what Big-O instead of O(n)?", answers: ["o(n^2)", "o(n2)"] },
  { prompt: "A quicksort implementation always picks the first element as pivot on an already-sorted array — this degrades to what worst-case complexity?", answers: ["o(n^2)", "o(n2)"] },
];

export const linuxDebugQuestions: TypingQuestion[] = [
  { prompt: "A script fails with 'Permission denied' when run as ./script.sh. What command grants execute permission (as typed, e.g. 'chmod +x script.sh')?", answers: ["chmod +x script.sh", "chmod +x"] },
  { prompt: "'command not found' even though the binary exists in the current folder. What relative-path prefix is missing before the command?", answers: ["./"] },
  { prompt: "A process won't die with a normal kill. What signal number (or SIGKILL name) forces it?", answers: ["9", "sigkill", "kill -9"] },
  { prompt: "You need to find which process is using port 3000. What command (with an argument) shows this? (e.g. 'lsof -i :3000')", answers: ["lsof -i :3000", "lsof"] },
  { prompt: "A disk is full but 'du' doesn't show why. What command shows overall disk usage per filesystem?", answers: ["df", "df -h"] },
];

export const regexDebugQuestions: TypingQuestion[] = [
  { prompt: "The regex /.+@.+\\..+/ matches too loosely — '.' unescaped matches any character. What character should '.' be preceded by to match a literal dot?", answers: ["\\", "backslash"] },
  { prompt: "/^abc/ only matches strings starting with 'abc'. What symbol should be added at the end to also require the string END there (only exactly 'abc')?", answers: ["$"] },
  { prompt: "A regex meant to match 'aaa' one or more times as a whole word incorrectly also matches inside 'aaaa'. What quantifier symbol means 'one or more'?", answers: ["+"] },
  { prompt: "You want to match any digit. What shorthand character class means digit? (as typed, e.g. \\\\d)", answers: ["\\d"] },
  { prompt: "A regex hangs on certain input — classic sign of what performance problem with nested quantifiers?", answers: ["catastrophic backtracking"] },
];

export const httpDebugQuestions: TypingQuestion[] = [
  { prompt: "An API returns 500 for a request with a malformed JSON body — arguably it should return what 4xx status instead (client's fault, not server's)?", answers: ["400"] },
  { prompt: "A DELETE request keeps needing to be retried because the server can't tell if it already succeeded. What property should DELETE have (repeating it has the same effect as once)?", answers: ["idempotent", "idempotency"] },
  { prompt: "A browser blocks a fetch() to another domain with a CORS error. What HTTP response header must the server include to allow it?", answers: ["access-control-allow-origin"] },
  { prompt: "A client keeps sending expired credentials and getting confusing 500s. What status code should the server return instead to correctly signal 'not authenticated'?", answers: ["401"] },
  { prompt: "A cached GET response is stale after an update. What header controls how long a response can be cached?", answers: ["cache-control"] },
];

export const dockerDebugQuestions: TypingQuestion[] = [
  { prompt: "A container exits immediately after 'docker run'. Usually this means the main process did what (one word)?", answers: ["exited", "finished", "crashed"] },
  { prompt: "Changes to your source code aren't showing up in a running container. What flag mounts your local folder into the container live? (as typed, e.g. '-v')", answers: ["-v", "--volume"] },
  { prompt: "A Docker image is huge because build tools got baked into the final image. What technique (two words) uses a separate build stage to avoid this?", answers: ["multi-stage build", "multi-stage"] },
  { prompt: "docker ps shows nothing, but you know a container is running. What flag also shows exited/all containers?", answers: ["-a", "--all"] },
  { prompt: "A container can't reach another container by name on the same custom network. What Docker feature normally provides this (DNS-based container name resolution)?", answers: ["dns", "service discovery"] },
];
