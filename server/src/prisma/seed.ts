import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Placement Preparation Platform database...");

  // 1. Create Default Admin & Demo Student
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const studentPasswordHash = await bcrypt.hash("Student@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@placement.edu" },
    update: {},
    create: {
      name: "Prof. Placement Coordinator",
      email: "admin@placement.edu",
      passwordHash: adminPasswordHash,
      role: "admin",
      branch: "Training & Placement Cell",
      graduationYear: 2026,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@placement.edu" },
    update: {},
    create: {
      name: "Ashwin Kumar",
      email: "student@placement.edu",
      passwordHash: studentPasswordHash,
      role: "student",
      branch: "Computer Science and Engineering",
      graduationYear: 2026,
    },
  });

  console.log("✅ Seeded Admin & Demo Student users");

  // 2. Canonical Topics (The shared spine of the schema)
  const topicData = [
    { name: "Dynamic Programming", slug: "dynamic-programming", category: "Algorithms" },
    { name: "Trees & Binary Search Trees", slug: "trees", category: "Data Structures" },
    { name: "Graphs & BFS/DFS", slug: "graphs", category: "Algorithms" },
    { name: "Arrays & Hashing", slug: "arrays-hashing", category: "Data Structures" },
    { name: "Strings & Pattern Matching", slug: "strings", category: "Data Structures" },
    { name: "Two Pointers & Sliding Window", slug: "two-pointers", category: "Algorithms" },
    { name: "Binary Search", slug: "binary-search", category: "Algorithms" },
    { name: "Greedy Algorithms", slug: "greedy", category: "Algorithms" },
    { name: "Recursion & Backtracking", slug: "recursion-backtracking", category: "Algorithms" },
    { name: "Stacks & Queues", slug: "stacks-queues", category: "Data Structures" },
    { name: "Heaps & Priority Queues", slug: "heaps-priority-queues", category: "Data Structures" },
    { name: "Linked Lists", slug: "linked-lists", category: "Data Structures" },
    { name: "Bit Manipulation", slug: "bit-manipulation", category: "Algorithms" },
    { name: "Mathematics & Number Theory", slug: "mathematics", category: "Algorithms" },
    { name: "System Design & Low-Level Design", slug: "system-design", category: "Engineering" },
    { name: "Database Management Systems", slug: "database-management", category: "Core CS" },
    { name: "Operating Systems & Concurrency", slug: "operating-systems", category: "Core CS" },
    { name: "Computer Networks", slug: "computer-networks", category: "Core CS" },
    { name: "Object Oriented Design", slug: "object-oriented-design", category: "Core CS" },
    { name: "Behavioral & HR Leadership", slug: "behavioral", category: "Interview Skills" },
  ];

  const topicsMap: Record<string, string> = {};
  for (const t of topicData) {
    const created = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    topicsMap[t.slug] = created.id;
  }
  console.log(`✅ Seeded ${topicData.length} core canonical topics`);

  // 3. Companies & Rounds
  const companiesData = [
    {
      name: "Google",
      sector: "Product & Cloud",
      description: "Global tech company renowned for high-bar algorithmic problem solving and distributed systems.",
      rolesHiredFor: "Software Engineer - Campus, Associate Cloud Engineer",
      rounds: [
        { type: "online_test", order: 1, description: "2 Questions (60 Mins) on Codeforces-style Medium/Hard DP and Trees" },
        { type: "technical", order: 2, description: "Tech Round 1: Core Algorithms, Time & Space Complexity, Clean Code" },
        { type: "technical", order: 3, description: "Tech Round 2: Advanced Graph Algorithms & Scalable Architecture" },
        { type: "hr", order: 4, description: "Googliness & Leadership: Handling ambiguity and team disagreements" },
      ],
    },
    {
      name: "Amazon",
      sector: "E-Commerce & AWS",
      description: "Leadership principles paired with practical data structures and system design fundamentals.",
      rolesHiredFor: "SDE 1 (FTE), SDE Intern (6 Months)",
      rounds: [
        { type: "online_test", order: 1, description: "2 Coding Questions + Work Style Simulation Assessment" },
        { type: "technical", order: 2, description: "Technical 1: Trees, HashMaps, Two Pointers + 1 Leadership Principle" },
        { type: "technical", order: 3, description: "Technical 2: Dynamic Programming, Graph Traversal + Customer Obsession" },
        { type: "hr", order: 4, description: "Bar Raiser: Deep dive into projects and Amazon Leadership Principles" },
      ],
    },
    {
      name: "Microsoft",
      sector: "Enterprise Software & Cloud",
      description: "Focus on clean coding practices, edge cases, OOP design, and core CS fundamentals.",
      rolesHiredFor: "Software Engineer, Cloud Solutions Architect",
      rounds: [
        { type: "online_test", order: 1, description: "3 Coding Questions on Strings, Arrays, and Math" },
        { type: "technical", order: 2, description: "Technical 1: Data Structures, Linked Lists, Stack/Queue edge cases" },
        { type: "technical", order: 3, description: "Technical 2: Tree Traversals, System Design & DBMS queries" },
        { type: "hr", order: 4, description: "Managerial Round: Cultural fit, project decisions, growth mindset" },
      ],
    },
    {
      name: "Atlassian",
      sector: "Developer Tools & SaaS",
      description: "Rigorous focus on clean production code, modular low-level design, and values interview.",
      rolesHiredFor: "Graduate Software Engineer",
      rounds: [
        { type: "online_test", order: 1, description: "Hackerrank Coding Assessment: 3 algorithmic challenges" },
        { type: "technical", order: 2, description: "Coding & Data Structures: Concurrency, Graphs, Modular methods" },
        { type: "technical", order: 3, description: "System Design & LLD: Design a Rate Limiter or Notification Hub" },
        { type: "hr", order: 4, description: "Values Interview: Open company no bullshit, play as a team" },
      ],
    },
    {
      name: "TCS",
      sector: "IT Services & Consulting",
      description: "National qualifier test (NQT) followed by technical, managerial, and HR interview.",
      rolesHiredFor: "TCS Digital, TCS Prime, TCS Ninja",
      rounds: [
        { type: "online_test", order: 1, description: "TCS NQT: Aptitude, Logical Reasoning, Advanced Coding" },
        { type: "technical", order: 2, description: "Technical Interview: OOPS in Java/C++, SQL queries, OS concepts" },
        { type: "hr", order: 3, description: "Managerial & HR: Willingness to relocate, project walkthrough" },
      ],
    },
  ];

  const roundIdsByCompanyAndType: Record<string, Record<string, string>> = {};

  for (const c of companiesData) {
    const company = await prisma.company.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        sector: c.sector,
        description: c.description,
        rolesHiredFor: c.rolesHiredFor,
      },
    });

    roundIdsByCompanyAndType[c.name] = {};

    for (const r of c.rounds) {
      // Find existing or create
      const existingRound = await prisma.round.findFirst({
        where: { companyId: company.id, type: r.type, order: r.order },
      });
      const round =
        existingRound ||
        (await prisma.round.create({
          data: {
            companyId: company.id,
            type: r.type,
            order: r.order,
            description: r.description,
          },
        }));

      roundIdsByCompanyAndType[c.name][r.type] = round.id;
    }
  }
  console.log("✅ Seeded Companies and Assessment Rounds");

  // 4. ~30 Authentic Seed Questions
  const seedQuestions = [
    // Google Questions
    {
      company: "Google",
      roundType: "online_test",
      topicSlug: "dynamic-programming",
      difficulty: "hard",
      verified: true,
      upvotes: 18,
      matches: 12,
      source: "Google OA Senior Experience 2025",
      text: "Given a grid of N x M cells with positive weights, calculate the minimum path cost to visit at least K unique obstacle coordinates while moving only down, right, and conditionally diagonally.",
    },
    {
      company: "Google",
      roundType: "online_test",
      topicSlug: "trees",
      difficulty: "medium",
      verified: true,
      upvotes: 14,
      matches: 9,
      source: "Google On-Campus OA",
      text: "Find the maximum sum of values on any path in a binary tree where path nodes must have strictly alternating even and odd node values.",
    },
    {
      company: "Google",
      roundType: "technical",
      topicSlug: "graphs",
      difficulty: "hard",
      verified: true,
      upvotes: 25,
      matches: 17,
      source: "Google Tech Round 1",
      text: "Given a directed graph with positive and negative cycle risks, determine whether there exists a valid sequence of transactions that results in zero overall currency conversion loss. Implement an optimized Bellman-Ford or SPFA variant.",
    },
    {
      company: "Google",
      roundType: "technical",
      topicSlug: "heaps-priority-queues",
      difficulty: "medium",
      verified: true,
      upvotes: 19,
      matches: 11,
      source: "Google Tech Round 2",
      text: "Design a live analytics sliding window that maintains the median latency of the last 10,000 server requests in real-time. Discuss trade-offs between two heaps vs. an order statistic tree.",
    },
    {
      company: "Google",
      roundType: "hr",
      topicSlug: "behavioral",
      difficulty: "easy",
      verified: true,
      upvotes: 8,
      matches: 14,
      source: "Google Googliness Round",
      text: "Describe a scenario where you were tasked with building a feature with ambiguous requirements and no senior engineer was available. How did you break down the problem and validate assumptions?",
    },

    // Amazon Questions
    {
      company: "Amazon",
      roundType: "online_test",
      topicSlug: "two-pointers",
      difficulty: "medium",
      verified: true,
      upvotes: 22,
      matches: 28,
      source: "Amazon SDE OA 2025",
      text: "Amazon warehouse package sorting: Given an array of parcel weights and truck capacity C, find the number of contiguous subarrays whose total weight does not exceed C and contains at most 2 distinct parcel categories.",
    },
    {
      company: "Amazon",
      roundType: "online_test",
      topicSlug: "arrays-hashing",
      difficulty: "easy",
      verified: true,
      upvotes: 16,
      matches: 21,
      source: "Amazon OA 2025",
      text: "Given logs of customer order timestamps and user IDs, find the user who placed the highest number of transactions within any consecutive 10-minute sliding window.",
    },
    {
      company: "Amazon",
      roundType: "technical",
      topicSlug: "trees",
      difficulty: "medium",
      verified: true,
      upvotes: 31,
      matches: 26,
      source: "Amazon Tech Round 1",
      text: "Construct a Lowest Common Ancestor (LCA) query engine for an organizational hierarchy tree where each employee node stores an array of subordinates. Explain how to answer queries in O(1) after O(N log N) binary lifting preprocessing.",
    },
    {
      company: "Amazon",
      roundType: "technical",
      topicSlug: "dynamic-programming",
      difficulty: "hard",
      verified: true,
      upvotes: 27,
      matches: 19,
      source: "Amazon Tech Round 2",
      text: "Word Break II variant: Given a stream of query terms and an Amazon product dictionary, output all possible sentences where spaces can be placed between words. Analyze recursion memoization vs. trie-based DP.",
    },
    {
      company: "Amazon",
      roundType: "technical",
      topicSlug: "system-design",
      difficulty: "medium",
      verified: true,
      upvotes: 20,
      matches: 15,
      source: "Amazon Technical 2",
      text: "Design a distributed locker reservation service for Prime delivery packages. How do you prevent double-booking lockers across concurrent customer pickup confirmations?",
    },
    {
      company: "Amazon",
      roundType: "hr",
      topicSlug: "behavioral",
      difficulty: "easy",
      verified: true,
      upvotes: 12,
      matches: 20,
      source: "Amazon Bar Raiser",
      text: "Give an example of a time when you had to make an important architectural decision with incomplete data. How did you apply Bias for Action without risking production reliability?",
    },

    // Microsoft Questions
    {
      company: "Microsoft",
      roundType: "online_test",
      topicSlug: "strings",
      difficulty: "medium",
      verified: true,
      upvotes: 15,
      matches: 18,
      source: "Microsoft Codility Test",
      text: "Given an encoded string of letters and bracket counts (e.g., '3[a2[c]]'), decode the sequence without using excess recursion stack space, handling malformed brackets safely.",
    },
    {
      company: "Microsoft",
      roundType: "technical",
      topicSlug: "linked-lists",
      difficulty: "medium",
      verified: true,
      upvotes: 18,
      matches: 22,
      source: "Microsoft Technical 1",
      text: "Reverse a linked list in groups of size K. If the remaining nodes at the end are less than K, reverse them as well (modified K-group reversal). Maintain O(1) extra space.",
    },
    {
      company: "Microsoft",
      roundType: "technical",
      topicSlug: "operating-systems",
      difficulty: "medium",
      verified: true,
      upvotes: 21,
      matches: 16,
      source: "Microsoft Technical 2",
      text: "Explain the internal difference between a thread and a process in the Linux and Windows NT kernels. Implement a thread-safe circular buffer with mutexes and condition variables.",
    },
    {
      company: "Microsoft",
      roundType: "technical",
      topicSlug: "database-management",
      difficulty: "medium",
      verified: true,
      upvotes: 17,
      matches: 19,
      source: "Microsoft Technical 2",
      text: "Compare B-Trees vs. B+ Trees for relational database indexing. Write an optimized SQL query with window functions to find the 3rd highest salary department-wise.",
    },

    // Atlassian Questions
    {
      company: "Atlassian",
      roundType: "online_test",
      topicSlug: "graphs",
      difficulty: "hard",
      verified: true,
      upvotes: 14,
      matches: 10,
      source: "Atlassian OA",
      text: "Given a network of Jira projects with inter-task dependencies, detect whether a circular dependency exists and output the earliest parallel execution schedule using Topological Sort (Kahn's Algorithm).",
    },
    {
      company: "Atlassian",
      roundType: "technical",
      topicSlug: "system-design",
      difficulty: "hard",
      verified: true,
      upvotes: 24,
      matches: 15,
      source: "Atlassian LLD Round",
      text: "Implement a Low Level Design for a Token Bucket Rate Limiter in Java/TypeScript. Ensure thread-safety for high-throughput microservices handling 50k requests per second.",
    },
    {
      company: "Atlassian",
      roundType: "hr",
      topicSlug: "behavioral",
      difficulty: "easy",
      verified: true,
      upvotes: 9,
      matches: 11,
      source: "Atlassian Values Round",
      text: "Describe a project where you recognized technical debt accumulating in your codebase. How did you convince your team to prioritize refactoring instead of shipping new features?",
    },

    // TCS Questions
    {
      company: "TCS",
      roundType: "online_test",
      topicSlug: "mathematics",
      difficulty: "easy",
      verified: true,
      upvotes: 19,
      matches: 34,
      source: "TCS NQT Advanced Coding",
      text: "Given an array of positive integers, calculate whether each number can be expressed as the sum of two distinct prime numbers (Goldbach conjecture verification).",
    },
    {
      company: "TCS",
      roundType: "technical",
      topicSlug: "object-oriented-design",
      difficulty: "easy",
      verified: true,
      upvotes: 22,
      matches: 40,
      source: "TCS Digital Technical",
      text: "Explain the four pillars of Object-Oriented Programming with real-world banking domain examples. Differentiate between method overloading and method overriding in terms of compile-time vs runtime binding.",
    },
    {
      company: "TCS",
      roundType: "technical",
      topicSlug: "database-management",
      difficulty: "easy",
      verified: true,
      upvotes: 25,
      matches: 38,
      source: "TCS Prime Interview",
      text: "What are ACID properties in a relational database? Explain isolation levels and demonstrate how a dirty read differs from a phantom read.",
    },

    // Additional Student Submitted (Unverified & Community) Questions
    {
      company: "Google",
      roundType: "technical",
      topicSlug: "binary-search",
      difficulty: "medium",
      verified: false,
      upvotes: 6,
      matches: 4,
      source: "Student Peer Interview 2026",
      text: "Find the median of two sorted arrays of different sizes in O(log(min(N, M))) logarithmic time.",
    },
    {
      company: "Amazon",
      roundType: "technical",
      topicSlug: "recursion-backtracking",
      difficulty: "medium",
      verified: false,
      upvotes: 5,
      matches: 3,
      source: "Student Peer Interview 2026",
      text: "Generate all valid combinations of IP addresses from a given raw numeric string.",
    },
    {
      company: "Microsoft",
      roundType: "online_test",
      topicSlug: "stacks-queues",
      difficulty: "medium",
      verified: false,
      upvotes: 7,
      matches: 5,
      source: "Student Peer Interview 2026",
      text: "Next Greater Element II: Given a circular integer array, print the next greater element for each index in O(N) using a monotonic stack.",
    },
  ];

  for (const q of seedQuestions) {
    const roundId = roundIdsByCompanyAndType[q.company]?.[q.roundType];
    const topicId = topicsMap[q.topicSlug];

    if (roundId && topicId) {
      await prisma.question.create({
        data: {
          roundId,
          topicId,
          text: q.text,
          difficulty: q.difficulty,
          verified: q.verified,
          upvoteCount: q.upvotes,
          matchCount: q.matches,
          source: q.source,
          submittedById: q.verified ? admin.id : student.id,
        },
      });
    }
  }
  console.log(`✅ Seeded ${seedQuestions.length} company interview questions with verified/unverified status`);

  // 5. Seed Core Resources
  const resourcesData = [
    {
      title: "NeetCode 150 - Dynamic Programming Deep Dive",
      url: "https://neetcode.io/practice",
      type: "sheet",
      difficulty: "hard",
      topicSlugs: ["dynamic-programming"],
    },
    {
      title: "MIT 6.006: Introduction to Algorithms - Bellman-Ford & Graph Paths",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      type: "video",
      difficulty: "hard",
      topicSlugs: ["graphs"],
    },
    {
      title: "Striver's SDE Sheet - Trees and Binary Search Trees",
      url: "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/",
      type: "sheet",
      difficulty: "medium",
      topicSlugs: ["trees"],
    },
    {
      title: "System Design Primer by Donne Martin",
      url: "https://github.com/donnemartin/system-design-primer",
      type: "article",
      difficulty: "medium",
      topicSlugs: ["system-design"],
    },
    {
      title: "Stanford CS 110: Principles of Computer Systems & Concurrency",
      url: "https://web.stanford.edu/class/cs110/",
      type: "course",
      difficulty: "hard",
      topicSlugs: ["operating-systems"],
    },
    {
      title: "Grokking the Low Level Design (OOD & Design Patterns)",
      url: "https://github.com/ashishps1/awesome-low-level-design",
      type: "article",
      difficulty: "medium",
      topicSlugs: ["object-oriented-design"],
    },
  ];

  for (const res of resourcesData) {
    const topicIds = res.topicSlugs.map((s) => topicsMap[s]).filter(Boolean);
    await prisma.resource.create({
      data: {
        title: res.title,
        url: res.url,
        type: res.type,
        difficulty: res.difficulty,
        addedById: admin.id,
        topics: {
          connect: topicIds.map((id) => ({ id })),
        },
      },
    });
  }
  console.log(`✅ Seeded ${resourcesData.length} learning resources`);

  // 6. Seed Initial Resume for Demo Student
  const demoResume = await prisma.resume.create({
    data: {
      userId: student.id,
      title: "Ashwin Kumar - SDE Resume 2026",
      targetRole: "Full Stack Software Development Engineer",
    },
  });

  const sampleResumeText = `ASHWIN KUMAR
Computer Science and Engineering | Graduating 2026
Email: ashwin.k@example.com | Phone: +91 98765 43210 | GitHub: github.com/ashwin-k | LeetCode: leetcode.com/ashwin_k

EDUCATION
B.Tech in Computer Science and Engineering (CGPA: 8.92 / 10.0) | 2022 - 2026

TECHNICAL SKILLS
Languages: C++, TypeScript, JavaScript, Python, SQL
Frameworks & Libraries: React, Next.js, Node.js, Express.js, Tailwind CSS
Databases & Cloud: PostgreSQL, MongoDB, Redis, Docker, Git

PROJECTS
• Placement Preparation & Interview Insights Platform
- Architected a full-stack platform using Next.js, Node.js, and PostgreSQL for campus placement prep.
- Implemented automated weak-topic correlation algorithm mapping Codeforces & LeetCode submissions against company interview patterns.
- Integrated AI inference pipeline with Zod validation for resume auditing and company-specific question generation.

• Distributed In-Memory Cache (C++ / TCP Sockets)
- Developed a multi-threaded in-memory key-value store using LRU eviction policy handling 12,000+ operations/sec.
- Synchronized concurrent worker threads using mutex locks and condition variables, avoiding race conditions.

EXPERIENCE
• Software Engineering Intern | TechNova Solutions (June 2025 - August 2025)
- Built RESTful APIs in Express and TypeScript serving 10,000+ daily requests.
- Optimized database indexing and query joins, cutting average response time from 320ms to 95ms.
- Collaborated in an agile sprint team with bi-weekly code reviews and CI/CD pipelines.

ACHIEVEMENTS
• Solved 350+ data structures & algorithms problems across LeetCode and Codeforces (Pupil 1320 rating).
• Winner of College Smart India Internal Hackathon 2024.`;

  const resumeVersion = await prisma.resumeVersion.create({
    data: {
      resumeId: demoResume.id,
      versionNumber: 1,
      extractedText: sampleResumeText,
    },
  });

  console.log("✅ Seeded sample student resume profile & version");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
