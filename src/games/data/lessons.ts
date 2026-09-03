export interface LessonStep {
  info: string;
  question: string;
  answers: string[];
}

export interface Lesson {
  id: string;
  title: string;
  steps: LessonStep[];
  summary: string;
}

// Original explanations, written for this app — 4-5 short steps each, each
// pairing a small piece of information with a quick check. Wrong answers
// still advance (shown the right one first) — this isn't a gate, it's meant
// to reinforce, not block progress.
export const LESSONS: Lesson[] = [
  {
    id: "quantum-superposition",
    title: "Quantum Superposition",
    steps: [
      {
        info: "A regular bit is always either 0 or 1. A qubit, before you measure it, can be in a mix of both states at once — this mix is called superposition.",
        question: "True or false: a qubit is always definitely 0 or definitely 1, even before measurement.",
        answers: ["false"],
      },
      {
        info: "The moment you measure a qubit, the superposition collapses — you get a definite 0 or 1, with a probability determined by the mix it was in.",
        question: "What happens to superposition the instant you measure a qubit?",
        answers: ["collapses", "it collapses"],
      },
      {
        info: "Two qubits can become entangled — measuring one instantly tells you something about the other, no matter how far apart they are.",
        question: "What's it called when two qubits' states become linked like this?",
        answers: ["entanglement", "entangled"],
      },
      {
        info: "This is why quantum computers can, for certain problems, explore many possibilities at once instead of one at a time like a classical computer.",
        question: "In one word: what property lets a quantum computer represent many possibilities simultaneously?",
        answers: ["superposition"],
      },
    ],
    summary: "You learned the basic idea of qubits, superposition, measurement collapse, and entanglement.",
  },
  {
    id: "https-tls",
    title: "How HTTPS Actually Works",
    steps: [
      {
        info: "HTTPS is HTTP wrapped in TLS (Transport Layer Security) — it encrypts the connection so a network eavesdropper can't read your data.",
        question: "What protocol does HTTPS use to encrypt the connection?",
        answers: ["tls"],
      },
      {
        info: "Before any data is sent, the browser and server do a 'handshake' — they agree on encryption methods and the server proves its identity with a certificate.",
        question: "What proves the server's identity during the handshake?",
        answers: ["certificate", "a certificate", "ssl certificate"],
      },
      {
        info: "Certificates are issued by trusted third parties called Certificate Authorities (CAs). Your browser has a built-in list of CAs it trusts.",
        question: "What's the abbreviation for the organization that issues certificates?",
        answers: ["ca", "cas"],
      },
      {
        info: "Once the handshake finishes, both sides have a shared secret key used to encrypt everything after that — this is called symmetric encryption, and it's fast.",
        question: "After the handshake, is the actual data encrypted with symmetric or asymmetric encryption?",
        answers: ["symmetric"],
      },
    ],
    summary: "You learned the core flow: TLS handshake, certificates, Certificate Authorities, and symmetric encryption for the actual data.",
  },
  {
    id: "hash-tables",
    title: "Hash Tables",
    steps: [
      {
        info: "A hash table stores key-value pairs. To find where to store a value, it runs the key through a hash function that produces a number.",
        question: "What do you run a key through to get a storage location?",
        answers: ["hash function", "a hash function"],
      },
      {
        info: "That number is used as an index into an underlying array — so lookups can jump straight to the right spot instead of scanning everything.",
        question: "Because of this direct jump, what's the average time complexity of a hash table lookup?",
        answers: ["o(1)"],
      },
      {
        info: "Sometimes two different keys hash to the same index — this is called a collision, and it has to be handled somehow (e.g. storing a small list at that index).",
        question: "What's it called when two keys hash to the same index?",
        answers: ["collision", "a collision"],
      },
      {
        info: "A bad hash function that clusters many keys into the same few indexes turns those O(1) lookups into slow O(n) scans through a long list.",
        question: "If collisions pile up badly, lookups degrade toward what complexity, instead of O(1)?",
        answers: ["o(n)"],
      },
    ],
    summary: "You learned how hash tables use a hash function for near-instant lookups, and why collisions matter.",
  },
  {
    id: "git-internals",
    title: "How Git Actually Works",
    steps: [
      {
        info: "Git doesn't store diffs between versions — every commit is a full snapshot of your entire project at that point in time.",
        question: "Does a git commit store a diff, or a full snapshot?",
        answers: ["snapshot", "a snapshot", "full snapshot"],
      },
      {
        info: "Each snapshot (and each commit) is identified by a hash of its content — that's the long string like a1b2c3... you see in git log.",
        question: "What algorithm-produced identifier does git use to name each commit?",
        answers: ["hash", "a hash"],
      },
      {
        info: "A branch is just a movable pointer to one specific commit — creating a branch is nearly instant because it's not copying any files.",
        question: "What is a git branch, technically?",
        answers: ["a pointer", "pointer", "a movable pointer"],
      },
      {
        info: "HEAD is a pointer to whichever branch (or commit) you currently have checked out — it's how git knows where your next commit should attach.",
        question: "What does HEAD point to?",
        answers: ["current branch", "the current branch", "current commit", "the branch you're on"],
      },
    ],
    summary: "You learned that commits are snapshots (not diffs), identified by hashes, and that branches and HEAD are just pointers.",
  },
  {
    id: "dns",
    title: "How DNS Actually Works",
    steps: [
      {
        info: "DNS translates human-readable domain names like example.com into IP addresses computers actually use to route traffic.",
        question: "What does DNS translate a domain name into?",
        answers: ["ip address", "an ip address", "ip"],
      },
      {
        info: "Your computer doesn't know every domain's address itself — it asks a resolver, usually run by your ISP or a public service, to look it up.",
        question: "What's the component that looks up the address on your behalf called?",
        answers: ["resolver", "a resolver", "dns resolver"],
      },
      {
        info: "If the resolver doesn't already have it cached, it walks a chain: root servers point to TLD servers (like .com), which point to the authoritative server for that specific domain.",
        question: "What kind of server holds the final, authoritative answer for one specific domain?",
        answers: ["authoritative server", "authoritative", "authoritative dns server"],
      },
      {
        info: "Once found, the answer is cached for a while (its TTL, time-to-live) so repeated lookups skip the whole chain and just reuse the cached result.",
        question: "What's the setting called that controls how long a DNS answer stays cached?",
        answers: ["ttl", "time-to-live", "time to live"],
      },
    ],
    summary: "You learned the resolver → root → TLD → authoritative server chain, and how TTL caching speeds up repeat lookups.",
  },
  {
    id: "big-o",
    title: "Big O Notation",
    steps: [
      {
        info: "Big O describes how an algorithm's running time grows as input size grows — not the exact speed, just the growth trend.",
        question: "Does Big O measure exact speed, or growth trend as input grows?",
        answers: ["growth trend", "growth", "trend"],
      },
      {
        info: "O(1) means constant time — the same number of steps no matter how big the input is, like grabbing an array element by index.",
        question: "What's it called when an algorithm takes the same time regardless of input size?",
        answers: ["constant time", "o(1)", "constant"],
      },
      {
        info: "O(n) means linear time — steps grow directly in proportion to input size, like scanning every item in a list once.",
        question: "If you double the input and the work exactly doubles too, what's that called?",
        answers: ["linear time", "o(n)", "linear"],
      },
      {
        info: "O(n²) means quadratic time — common in naive nested loops, like comparing every item to every other item. It gets slow fast as n grows.",
        question: "What's the Big O for a simple nested loop comparing every pair of items?",
        answers: ["o(n^2)", "o(n²)", "quadratic", "quadratic time"],
      },
    ],
    summary: "You learned to read Big O as a growth trend, and the shapes of O(1), O(n), and O(n²).",
  },
  {
    id: "docker-containers",
    title: "How Docker Containers Work",
    steps: [
      {
        info: "A container packages an app with everything it needs to run — but unlike a VM, it shares the host machine's kernel instead of running its own.",
        question: "Does a container run its own kernel, or share the host's?",
        answers: ["shares the host's", "share the host's", "host's kernel", "shares host kernel"],
      },
      {
        info: "This is why containers start in milliseconds and use far less overhead than a full virtual machine, which has to boot an entire separate OS.",
        question: "Why do containers start much faster than VMs?",
        answers: ["no separate os", "share kernel", "shared kernel", "don't boot os", "share the kernel"],
      },
      {
        info: "An image is the read-only blueprint (filesystem + config) a container is created from — you can spin up many containers from one image.",
        question: "What's the read-only blueprint a container is created from called?",
        answers: ["image", "an image", "docker image"],
      },
      {
        info: "Containers get isolation through kernel features like namespaces (separate view of processes/network) and cgroups (limits on CPU/memory usage).",
        question: "Name one of the two kernel features that give containers isolation and resource limits.",
        answers: ["namespaces", "cgroups", "namespace", "cgroup"],
      },
    ],
    summary: "You learned that containers share the host kernel (unlike VMs), and rely on images, namespaces, and cgroups.",
  },
  {
    id: "rest-apis",
    title: "REST APIs, Actually Understood",
    steps: [
      {
        info: "REST is a style for designing APIs around resources (nouns, like 'users' or 'orders') manipulated with standard HTTP methods (verbs).",
        question: "Does REST model an API around resources or around actions/functions?",
        answers: ["resources", "resource"],
      },
      {
        info: "GET reads a resource without changing it, POST creates a new one, PUT/PATCH updates one, and DELETE removes one.",
        question: "Which HTTP method is meant to read a resource without modifying it?",
        answers: ["get"],
      },
      {
        info: "A key REST property is statelessness — the server keeps no memory of previous requests; each request must carry everything needed to understand it.",
        question: "In one word: what REST property means the server doesn't remember previous requests?",
        answers: ["stateless", "statelessness"],
      },
      {
        info: "HTTP status codes communicate outcome: 2xx means success, 4xx means the client made a bad request, 5xx means the server itself failed.",
        question: "A 4xx status code means the problem is on which side — client or server?",
        answers: ["client", "client side", "client's"],
      },
    ],
    summary: "You learned REST's resource-based design, core HTTP verbs, statelessness, and what 2xx/4xx/5xx status codes mean.",
  },
  {
    id: "memory-stack-heap",
    title: "Stack vs Heap Memory",
    steps: [
      {
        info: "The stack stores local variables and function call info — it's fast and automatically cleaned up the instant a function returns.",
        question: "Is the stack cleaned up automatically, or does it need manual freeing?",
        answers: ["automatically", "automatic", "automatically cleaned up"],
      },
      {
        info: "The heap stores data that needs to outlive a single function call — it's more flexible but slower, and in many languages needs explicit management.",
        question: "Which region of memory typically holds data meant to outlive one function call?",
        answers: ["heap", "the heap"],
      },
      {
        info: "Because the stack just moves a pointer up and down for each call/return, allocating on it is essentially free compared to heap allocation.",
        question: "Which is generally faster to allocate on: the stack or the heap?",
        answers: ["stack", "the stack"],
      },
      {
        info: "A 'stack overflow' happens when too many nested function calls (often infinite recursion) use up all the space reserved for the stack.",
        question: "What's usually the cause of a stack overflow crash?",
        answers: ["infinite recursion", "too many nested calls", "deep recursion", "recursion"],
      },
    ],
    summary: "You learned the stack/heap split: fast auto-cleaned local calls vs. flexible longer-lived allocations, and what causes a stack overflow.",
  },
];
