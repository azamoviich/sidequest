export interface DetectiveCase {
  id: string;
  title: string;
  briefing: string;
  clues: { label: string; content: string }[];
  question: string;
  answers: string[];
}

// Original mysteries — each is solvable by cross-referencing 2-3 clues
// against each other, with at least one clue that's a deliberate red herring
// (rules out a suspicious-looking lead rather than confirming it).
export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: "midnight-deploy",
    title: "The Midnight Deploy",
    briefing: "A production server went down at 03:17 AM. Four sources of evidence are available. Find out who — or what — caused it.",
    clues: [
      {
        label: "Access Logs",
        content:
          "03:12 — user 'raj.patel' SSH login from 10.0.4.22\n" +
          "03:14 — user 'raj.patel' ran: git pull origin main\n" +
          "03:15 — user 'intern_amy' SSH login from 10.0.4.55\n" +
          "03:16 — user 'intern_amy' ran: npm run deploy --force --skip-tests\n" +
          "03:17 — server health check FAILED\n" +
          "03:19 — user 'raj.patel' SSH login again",
      },
      {
        label: "Employee Statements",
        content:
          "raj.patel: 'I was just pulling the latest changes to review them. I didn't deploy anything.'\n\n" +
          "intern_amy: 'I was told the fix was urgent and approved. I just ran the script I was given.'\n\n" +
          "ops_lead: 'Deploys are supposed to go through CI, no exceptions. I don't know who approved skipping that this time.'",
      },
      {
        label: "System Logs",
        content:
          "03:16:02 — deploy started by intern_amy, flag: --skip-tests\n" +
          "03:16:45 — build completed with 2 warnings (ignored due to --skip-tests)\n" +
          "03:16:58 — old process killed, new process starting\n" +
          "03:17:03 — new process crashed: missing environment variable DB_HOST\n" +
          "03:17:04 — health check failed, server down",
      },
      {
        label: "Network Activity",
        content: "No unusual external traffic detected 03:00-03:30.\nNo signs of intrusion or unauthorized access from outside the company network.",
      },
    ],
    question: "Who caused the outage? (username)",
    answers: ["intern_amy", "amy"],
  },
  {
    id: "vanishing-invoice",
    title: "The Vanishing Invoice",
    briefing: "Invoice #4521 disappeared from the database overnight. A real customer is asking where their paid invoice went.",
    clues: [
      {
        label: "Database Logs",
        content:
          "01:02 — user 'billing_service' UPDATE invoices SET status='paid' WHERE id=4521\n" +
          "01:45 — user 'dev_chris' connected via admin console\n" +
          "01:47 — dev_chris ran: DELETE FROM invoices WHERE customer_id=88\n" +
          "02:00 — scheduled backup job started\n" +
          "02:10 — backup job completed successfully",
      },
      {
        label: "Employee Statements",
        content:
          "dev_chris: 'I was cleaning up test data for customer_id 88, a sandbox account. I had no idea a real invoice was attached to that same ID.'\n\n" +
          "billing_service (automated): 'No errors reported.'\n\n" +
          "support_lead: 'Customer 88 is flagged as a demo account in our system.'",
      },
      {
        label: "System Config",
        content:
          "customer_id 88 = 'ACME Demo Corp' (flagged: DEMO ACCOUNT)\n" +
          "Invoice #4521 = customer_id 88, amount $4,200, status: paid (as of 01:02)\n" +
          "Note: invoice #4521 was manually reassigned to customer_id 88 three weeks ago due to a merge error.",
      },
    ],
    question: "Whose action deleted the invoice? (name)",
    answers: ["dev_chris", "chris"],
  },
  {
    id: "leaked-api-key",
    title: "The Leaked API Key",
    briefing: "A production API key was found exposed in a public GitHub repo. Find out how it actually got there.",
    clues: [
      {
        label: "Git History",
        content:
          "commit a1b2c3 by 'sam.wu': 'quick fix for staging config' — hardcoded STAGING_API_KEY directly in config.js\n" +
          "commit d4e5f6 by 'sam.wu': 'remove hardcoded key' — key removed in the latest version\n" +
          "Note: the key is still present in commit a1b2c3's history, even after being 'removed' later.",
      },
      {
        label: "Employee Statements",
        content:
          "sam.wu: 'I was in a rush before a demo and hardcoded it temporarily, then removed it in the next commit. I thought that fixed it.'\n\n" +
          "security_lead: 'Removing a secret in a later commit does NOT remove it from git history — it's still recoverable by anyone browsing old commits.'",
      },
      {
        label: "Repo Settings",
        content: "Repository visibility: PUBLIC (changed from private to public 2 days ago for an open-source release).\nNo secret-scanning bot was enabled on this repository.",
      },
    ],
    question: "Whose commit originally introduced the leaked key? (name)",
    answers: ["sam.wu", "sam"],
  },
];
