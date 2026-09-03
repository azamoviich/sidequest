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
];
