const trendingTopics = [
  {
    id: 'artificial-intelligence',
    title: 'Artificial Intelligence',
    icon: 'brain',
    shortDescription: 'Explore the foundations of intelligent systems, from search algorithms to neural networks.',
    introduction: `Artificial Intelligence (AI) is a broad field of computer science focused on building systems capable of performing tasks that typically require human intelligence. This includes learning from experience, understanding natural language, recognizing patterns in data, making decisions under uncertainty, and solving complex problems. AI draws from disciplines including mathematics, statistics, neuroscience, linguistics, and philosophy.

The modern AI landscape is dominated by Machine Learning, where systems improve through data exposure rather than explicit programming. Sub-fields like computer vision, natural language processing, robotics, and reinforcement learning each tackle different facets of intelligence. Understanding AI requires grasping both the theoretical underpinnings — probability, optimization, information theory — and the practical engineering of scalable systems that operate in the real world.`,
    studyMaterials: [
      'Search Algorithms (BFS, DFS, A*)',
      'Constraint Satisfaction Problems',
      'Probabilistic Reasoning & Bayesian Networks',
      'Markov Decision Processes',
      'Supervised vs. Unsupervised Learning',
      'Neural Network Fundamentals',
      'Reinforcement Learning Basics',
      'Ethics & Bias in AI Systems',
    ],
    videoLectures: [
      { title: 'MIT 6.034 — Artificial Intelligence (Full Course)', url: 'https://www.youtube.com/playlist?list=PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi' },
      { title: 'Stanford CS221 — Artificial Intelligence: Principles and Techniques', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rO1NB9TD4iUZ3qghGEGtqNX' },
      { title: 'Harvard CS50 — Introduction to AI with Python', url: 'https://www.youtube.com/playlist?list=PLhQjrBD2T381PopUTYtMSstgk-hsTGkVm' },
    ],
    books: [
      { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell & Peter Norvig', whyRead: 'The definitive AI textbook used by 1500+ universities worldwide. Covers every major AI topic from search to deep learning.' },
      { title: 'Life 3.0: Being Human in the Age of AI', author: 'Max Tegmark', whyRead: 'A compelling exploration of the future of AI and its impact on the nature of work, war, and what it means to be human.' },
      { title: 'The Alignment Problem', author: 'Brian Christian', whyRead: 'A deep dive into one of AI\'s most critical challenges — ensuring AI systems do what we actually want them to do.' },
    ],
    researchPapers: [
      { title: 'Computing Machinery and Intelligence', authors: 'Alan Turing', url: 'https://academic.oup.com/mind/article/LIX/236/433/986238' },
      { title: 'A Few Useful Things to Know About Machine Learning', authors: 'Pedro Domingos', url: 'https://arxiv.org/abs/2108.02497' },
      { title: 'Reward is Enough', authors: 'David Silver et al.', url: 'https://arxiv.org/abs/2104.12787' },
    ],
  },
  {
    id: 'large-language-models',
    title: 'Large Language Models',
    icon: 'sparkles',
    shortDescription: 'Understand the transformer architecture, training methods, and capabilities of modern LLMs.',
    introduction: `Large Language Models (LLMs) represent one of the most significant breakthroughs in modern AI. These models — including GPT, Gemini, Claude, and LLaMA — are massive neural networks trained on vast corpora of text data, learning to predict the next token in a sequence. Through this deceptively simple objective, they acquire remarkable capabilities: coherent text generation, code synthesis, logical reasoning, translation, summarization, and even multi-modal understanding.

The foundation of LLMs is the Transformer architecture, introduced in the landmark 2017 paper "Attention Is All You Need." Key innovations include self-attention mechanisms, positional encodings, and layer normalization. Modern LLM research extends into areas like Reinforcement Learning from Human Feedback (RLHF), chain-of-thought prompting, retrieval-augmented generation (RAG), mixture of experts, multi-modal integration, and the emerging science of "prompt engineering" — learning to communicate effectively with these models to extract their full potential.`,
    studyMaterials: [
      'The Transformer Architecture (Self-Attention, Multi-Head Attention)',
      'Tokenization (BPE, SentencePiece)',
      'Pre-training vs. Fine-tuning vs. RLHF',
      'Prompt Engineering & In-Context Learning',
      'Retrieval-Augmented Generation (RAG)',
      'Parameter-Efficient Fine-Tuning (LoRA, QLoRA)',
      'Scaling Laws (Chinchilla, Kaplan)',
      'Hallucination, Safety, and Alignment',
    ],
    videoLectures: [
      { title: 'Stanford CS224N — NLP with Deep Learning (2024)', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rMFqRtEuo6SGjY4XbRIVRd4' },
      { title: 'Andrej Karpathy — Let\'s Build GPT from Scratch', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY' },
      { title: '3Blue1Brown — But What Is a GPT? Visual Intro to Transformers', url: 'https://www.youtube.com/watch?v=wjZofJX0v4M' },
    ],
    books: [
      { title: 'Speech and Language Processing', author: 'Dan Jurafsky & James Martin', whyRead: 'The gold standard NLP textbook, regularly updated with chapters on transformers and LLMs. Free online draft available.' },
      { title: 'Build a Large Language Model (From Scratch)', author: 'Sebastian Raschka', whyRead: 'A hands-on guide to implementing a GPT-like LLM from the ground up in PyTorch. Perfect for deep understanding.' },
      { title: 'Designing Machine Learning Systems', author: 'Chip Huyen', whyRead: 'Covers the full ML systems lifecycle including how to deploy and serve LLMs in production at scale.' },
    ],
    researchPapers: [
      { title: 'Attention Is All You Need', authors: 'Vaswani, Shazeer, Parmar et al.', url: 'https://arxiv.org/abs/1706.03762' },
      { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Tom Brown et al.', url: 'https://arxiv.org/abs/2005.14165' },
      { title: 'Training Language Models to Follow Instructions with Human Feedback', authors: 'Long Ouyang et al.', url: 'https://arxiv.org/abs/2203.02155' },
    ],
  },
  {
    id: 'software-engineering',
    title: 'Modern Software Engineering',
    icon: 'code',
    shortDescription: 'Master scalable system design, clean architecture, DevOps pipelines, and engineering best practices.',
    introduction: `Modern Software Engineering has evolved far beyond writing code that works. It now encompasses the entire lifecycle of building, deploying, monitoring, and iterating on complex software systems at scale. Engineers must balance trade-offs between performance, reliability, maintainability, and developer velocity. The discipline draws from computer science theory, systems thinking, organizational behavior, and rigorous empirical methods.

Today's software engineering landscape emphasizes practices like microservices architecture, infrastructure as code, continuous integration/continuous deployment (CI/CD), observability, and site reliability engineering (SRE). The rise of cloud-native development, containerization with Docker and Kubernetes, and the increasing integration of AI into development workflows (AI-assisted coding, automated testing) are reshaping how teams build and ship software. Understanding distributed systems, API design, database internals, and security fundamentals is essential for any serious engineer.`,
    studyMaterials: [
      'System Design Fundamentals (Load Balancing, Caching, CDNs)',
      'Microservices vs. Monolith Architecture',
      'Design Patterns (SOLID, DRY, KISS)',
      'CI/CD Pipelines (GitHub Actions, Jenkins)',
      'Containerization (Docker, Kubernetes)',
      'Database Design (SQL vs. NoSQL, Indexing, Sharding)',
      'API Design (REST, GraphQL, gRPC)',
      'Observability (Logging, Metrics, Tracing)',
    ],
    videoLectures: [
      { title: 'MIT 6.824 — Distributed Systems (Full Course)', url: 'https://www.youtube.com/playlist?list=PLrw6a1wE39_tb2fErI4-WkMbsvGQk9_UB' },
      { title: 'System Design Interview — Full Course by NeetCode', url: 'https://www.youtube.com/watch?v=F8dicU7LLy0' },
      { title: 'Harvard CS50 — Introduction to Computer Science', url: 'https://www.youtube.com/playlist?list=PLhQjrBD2T381WAHyx1pq-sBfykqMBI7V4' },
    ],
    books: [
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', whyRead: 'The modern software engineer\'s bible. Covers distributed systems, replication, partitioning, and consistency in extraordinary depth.' },
      { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', whyRead: 'Essential reading on writing readable, maintainable code. Establishes foundational principles every developer should know.' },
      { title: 'System Design Interview (Vol. 1 & 2)', author: 'Alex Xu', whyRead: 'Step-by-step breakdowns of designing real-world systems like YouTube, Google Maps, and chat systems at scale.' },
    ],
    researchPapers: [
      { title: 'The Google File System', authors: 'Sanjay Ghemawat, Howard Gobioff, Shun-Tak Leung', url: 'https://research.google/pubs/pub51/' },
      { title: 'MapReduce: Simplified Data Processing on Large Clusters', authors: 'Jeffrey Dean & Sanjay Ghemawat', url: 'https://research.google/pubs/pub62/' },
      { title: 'On Designing and Deploying Internet-Scale Services', authors: 'James Hamilton', url: 'https://www.usenix.org/legacy/event/lisa07/tech/full_papers/hamilton/hamilton.pdf' },
    ],
  },
  {
    id: 'cloud-computing',
    title: 'Cloud Computing & Infrastructure',
    icon: 'cloud',
    shortDescription: 'Learn cloud architecture, serverless, IaC, and multi-cloud strategies powering the modern web.',
    introduction: `Cloud Computing has fundamentally transformed how organizations build, deploy, and scale software. Rather than owning and managing physical servers, businesses now rent elastic computing resources on-demand from providers like AWS, Google Cloud, and Microsoft Azure. This shift enables startups to launch globally in minutes and enterprises to handle traffic spikes of millions of users without over-provisioning infrastructure.

The cloud ecosystem encompasses a vast range of services: compute (EC2, Cloud Run, Lambda), storage (S3, Cloud Storage), databases (RDS, DynamoDB, Firestore), networking (VPCs, load balancers), and specialized AI/ML platforms. Key paradigms include Infrastructure as Code (Terraform, Pulumi), serverless computing (functions that scale to zero), container orchestration (Kubernetes, ECS), and the emerging edge computing model. Understanding cloud architecture patterns, cost optimization, security best practices (IAM, encryption), and multi-cloud strategies is critical for modern engineering teams.`,
    studyMaterials: [
      'Cloud Service Models (IaaS, PaaS, SaaS, FaaS)',
      'AWS / GCP / Azure Core Services',
      'Infrastructure as Code (Terraform, CloudFormation)',
      'Serverless Architecture (Lambda, Cloud Functions)',
      'Container Orchestration (Kubernetes, ECS)',
      'Networking (VPCs, Subnets, Load Balancers, DNS)',
      'Cloud Security (IAM, Encryption, Zero Trust)',
      'Cost Optimization & FinOps',
    ],
    videoLectures: [
      { title: 'AWS Certified Cloud Practitioner — Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc' },
      { title: 'Google Cloud Associate Cloud Engineer — Full Course', url: 'https://www.youtube.com/watch?v=jpno8FSqpc8' },
      { title: 'Kubernetes Tutorial for Beginners — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=X48VuDVv0do' },
    ],
    books: [
      { title: 'Cloud Native Patterns', author: 'Cornelia Davis', whyRead: 'A practical guide to designing applications that fully leverage cloud infrastructure — resilience, scalability, and operability.' },
      { title: 'Terraform: Up & Running', author: 'Yevgeniy Brikman', whyRead: 'The definitive guide to Infrastructure as Code. Learn to manage cloud infrastructure declaratively and reproducibly.' },
      { title: 'The Phoenix Project', author: 'Gene Kim, Kevin Behr, George Spafford', whyRead: 'A novel about IT, DevOps, and helping your business win. Makes complex DevOps concepts accessible through storytelling.' },
    ],
    researchPapers: [
      { title: 'Above the Clouds: A Berkeley View of Cloud Computing', authors: 'Michael Armbrust et al.', url: 'https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-28.pdf' },
      { title: 'The Datacenter as a Computer', authors: 'Luiz André Barroso, Urs Hölzle', url: 'https://research.google/pubs/pub35290/' },
      { title: 'Serverless Computing: One Step Forward, Two Steps Back', authors: 'Joseph M. Hellerstein et al.', url: 'https://arxiv.org/abs/1812.03651' },
    ],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    icon: 'shield',
    shortDescription: 'Dive into threat modeling, cryptography, network security, and ethical hacking fundamentals.',
    introduction: `Cybersecurity is the practice of protecting systems, networks, and data from digital attacks, unauthorized access, and damage. As organizations become increasingly digital and interconnected, the attack surface expands dramatically — making security not just an IT concern but a fundamental business imperative. Cybersecurity professionals must think like adversaries, understanding both offensive techniques and defensive countermeasures.

The field encompasses multiple domains: network security, application security, cloud security, cryptography, incident response, digital forensics, and governance/compliance. Modern challenges include ransomware, supply chain attacks, zero-day vulnerabilities, social engineering, and the security implications of AI-generated content. Practitioners must understand the CIA triad (Confidentiality, Integrity, Availability), the principle of least privilege, defense in depth, and zero-trust architecture. The field values both deep technical skills and the ability to communicate risk to non-technical stakeholders.`,
    studyMaterials: [
      'The CIA Triad (Confidentiality, Integrity, Availability)',
      'Cryptography Fundamentals (Symmetric, Asymmetric, Hashing)',
      'Network Security (Firewalls, IDS/IPS, VPNs)',
      'Web Application Security (OWASP Top 10)',
      'Authentication & Authorization (OAuth, JWT, MFA)',
      'Penetration Testing Methodology',
      'Incident Response & Digital Forensics',
      'Zero Trust Architecture',
    ],
    videoLectures: [
      { title: 'MIT 6.858 — Computer Systems Security (Full Course)', url: 'https://www.youtube.com/playlist?list=PLUl4u3cNGP62K2DjQLRxDNRi0z2IRWnNh' },
      { title: 'Stanford CS253 — Web Security (Full Course)', url: 'https://www.youtube.com/playlist?list=PL1y1iaEtjSYiiSGVlL1cHsXN_kvJOOhu-' },
      { title: 'The Cyber Mentor — Ethical Hacking Full Course', url: 'https://www.youtube.com/watch?v=3FNYvj2U0HM' },
    ],
    books: [
      { title: 'The Web Application Hacker\'s Handbook', author: 'Dafydd Stuttard & Marcus Pinto', whyRead: 'The comprehensive guide to finding and exploiting web application vulnerabilities. A must-read for any security-focused developer.' },
      { title: 'Cryptography and Network Security', author: 'William Stallings', whyRead: 'The definitive academic textbook on cryptographic algorithms, protocols, and network security implementations.' },
      { title: 'This Is How They Tell Me the World Ends', author: 'Nicole Perlroth', whyRead: 'A riveting investigation into the global cyber weapons market and its implications for security worldwide.' },
    ],
    researchPapers: [
      { title: 'BeyondCorp: A New Approach to Enterprise Security', authors: 'Rory Ward & Betsy Beyer (Google)', url: 'https://research.google/pubs/pub43231/' },
      { title: 'SoK: Eternal War in Memory', authors: 'László Szekeres et al.', url: 'https://arxiv.org/abs/1804.10415' },
      { title: 'An Empirical Study of Web Vulnerability Discovery Ecosystems', authors: 'Mingyi Zhao et al.', url: 'https://arxiv.org/abs/1507.06565' },
    ],
  },
];

export default trendingTopics;
