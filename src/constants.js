export const LEVELS = [
  {
    id: 1,
    title: "The Hero's Awakening",
    subtitle: "AI Engineer & Full-Stack Developer",
    description: "Seeking roles as a Generative AI Engineer, AI/ML Engineer, or Full-Stack Developer. Passionate about building intelligent systems, LLM integrations, and production-ready web solutions.",
    skills: ["AI / ML", "n8n Automation", "Python", "Web Dev"],
    color: "var(--color-cyan)"
  },
  {
    id: 2,
    title: "Level 2: The Origin",
    items: [
      {
        title: "B.E. - CSE (AI & ML)",
        subtitle: "Swami Vivekananda Institute of Technology (SVIT)",
        details: "CGPA: 7.8 | 2025 - Present",
        tags: ["Data Structures", "OOP", "AI/ML Fundamentals"]
      },
      {
        title: "Intermediate - MPC",
        subtitle: "Sri Chaitanya Educational Institutions",
        details: "89.2% | Graduated 2025"
      },
      {
        title: "SSC",
        subtitle: "Gowtham Model School",
        details: "CGPA: 10.0 / 10.0 | Graduated 2023"
      }
    ],
    quiz: {
      question: "What is Ankith's B.E. CGPA?",
      options: ['A. 7.5', 'B. 7.8', 'C. 8.0', 'D. 8.2'],
      correctIndex: 1
    },
    color: "var(--color-pink)"
  },
  {
    id: 3,
    title: "Level 3: Technical Arsenal",
    categories: [
      {
        title: "Languages",
        skills: ["Python", "Java", "C", "JavaScript"]
      },
      {
        title: "AI & Automation",
        skills: ["n8n Workflow", "LLM API", "AI Content", "Agentic AI"]
      },
      {
        title: "Developer Tools",
        skills: ["Git & GitHub", "VS Code", "REST APIs", "Flask + MongoDB"]
      },
      {
        title: "Core Concepts",
        skills: ["Data Structures", "OOP", "Debugging", "Prototyping"]
      }
    ],
    quiz: {
      question: "Which automation tool is in Ankith's arsenal?",
      options: ['A. Zapier', 'B. Jenkins', 'C. n8n', 'D. Ansible'],
      correctIndex: 2
    },
    color: "var(--color-yellow)"
  },
  {
    id: 4,
    title: "Level 4: Completed Quests",
    items: [
      {
        title: "Flocus Flow",
        subtitle: "Full-Stack Productivity App",
        description: "Built a full-stack productivity web application with task management, calendar tracking, and AI-based productivity insights.",
        tags: ['Flask', 'MongoDB', 'REST API', 'GitHub Pages', 'Render', 'AI Insights']
      },
      {
        title: "What The News",
        subtitle: "AI News Platform",
        description: "Built an AI-powered news platform that converts headlines into multi-style summaries using LLMs and n8n automation.",
        tags: ['LLM APIs', 'n8n Automation', 'AI Summarization', 'Hackathon']
      },
      {
        title: "Attendance Management",
        subtitle: "Node.js & Express",
        description: "Built role-based secure access with teacher authentication, attendance planner, and real-time tracking dashboard.",
        tags: ['Node.js', 'Express.js', 'Git', 'Render', 'Auth', 'Dashboard']
      }
    ],
    quiz: {
      question: "Which project used Flask + MongoDB on Render?",
      options: ['A. Hangman', 'B. What The News', 'C. Flocus Flow', 'D. Attendance Manager'],
      correctIndex: 2
    },
    color: "var(--color-green)"
  },
  {
    id: 5,
    title: "Level 5: Side Quests",
    items: [
      { title: "Python Intern | Cognifyz", details: "Clean Python solutions for real-world problems." },
      { title: "Python Intern | CodeSoft", details: "Built automation programs and file handling workflows." },
      { title: "Python Intern | CodeAlpha", details: "Mini-projects applying core Python concepts." },
      { title: "FactsCrate", details: "AI-generated short-form video content creation." },
      { title: "Nubee Gamer", details: "YouTube channel with 1.4K+ subscribers." }
    ],
    quiz: {
      question: "How many subscribers does Nubee Gamer have?",
      options: ['A. 500+', 'B. 1.4K+', 'C. 10K+', 'D. 2K+'],
      correctIndex: 1
    },
    color: "var(--color-purple)"
  }
];
