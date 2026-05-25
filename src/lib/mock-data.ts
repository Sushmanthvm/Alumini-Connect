export type Alumni = {
  id: string;
  name: string;
  photo: string;
  company: string;
  role: string;
  batch: string;
  location: string;
  skills: string[];
  tech: string[];
  careerPath: { year: string; role: string; company: string }[];
  certifications: string[];
  bio: string;
};

const avatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export const ALUMNI: Alumni[] = [
  {
    id: "1", name: "Priya Sharma", photo: avatar("Priya"), company: "Google", role: "Senior SWE",
    batch: "2022", location: "Bangalore, IN",
    skills: ["System Design", "Distributed Systems", "Leadership"],
    tech: ["Go", "Kubernetes", "GCP", "Python"],
    careerPath: [
      { year: "2018", role: "SWE Intern", company: "Flipkart" },
      { year: "2019", role: "SDE-1", company: "Razorpay" },
      { year: "2022", role: "SDE-2", company: "Google" },
      { year: "2024", role: "Senior SWE", company: "Google" },
    ],
    certifications: ["GCP Professional Architect", "Kubernetes CKA"],
    bio: "Passionate about building scale-out infrastructure. Mentoring 5+ juniors annually.",
  },
  {
    id: "2", name: "Arjun Mehta", photo: avatar("Arjun"), company: "Stripe", role: "Product Engineer",
    batch: "2023", location: "Dublin, IE",
    skills: ["Product Thinking", "TypeScript", "API Design"],
    tech: ["TypeScript", "React", "Ruby", "PostgreSQL"],
    careerPath: [
      { year: "2020", role: "Junior Dev", company: "Zoho" },
      { year: "2022", role: "Product Engineer", company: "Stripe" },
    ],
    certifications: ["AWS Solutions Architect"],
    bio: "Love shipping delightful payments experiences across the globe.",
  },
  {
    id: "3", name: "Sneha Iyer", photo: avatar("Sneha"), company: "Microsoft", role: "ML Engineer",
    batch: "2024", location: "Hyderabad, IN",
    skills: ["ML Ops", "Deep Learning", "NLP"],
    tech: ["Python", "PyTorch", "Azure ML", "Spark"],
    careerPath: [
      { year: "2019", role: "Data Analyst", company: "Mu Sigma" },
      { year: "2021", role: "ML Engineer", company: "Microsoft" },
    ],
    certifications: ["Azure AI Engineer", "TensorFlow Developer"],
    bio: "Building copilots that actually help people get work done.",
  },
  {
    id: "4", name: "Rahul Verma", photo: avatar("Rahul"), company: "Netflix", role: "Backend Engineer",
    batch: "2025", location: "Los Gatos, US",
    skills: ["Microservices", "Streaming", "Resilience"],
    tech: ["Java", "Spring", "Kafka", "Cassandra"],
    careerPath: [
      { year: "2017", role: "Backend Dev", company: "Walmart Labs" },
      { year: "2020", role: "SDE-2", company: "Amazon" },
      { year: "2023", role: "Backend Engineer", company: "Netflix" },
    ],
    certifications: ["AWS DevOps Pro"],
    bio: "Working on the playback stack — every millisecond counts.",
  },
  {
    id: "5", name: "Ananya Reddy", photo: avatar("Ananya"), company: "Figma", role: "Design Engineer",
    batch: "2022", location: "Remote",
    skills: ["UI Engineering", "Motion Design", "Accessibility"],
    tech: ["React", "Framer Motion", "WebGL", "Rust"],
    careerPath: [
      { year: "2021", role: "Frontend Dev", company: "Postman" },
      { year: "2023", role: "Design Engineer", company: "Figma" },
    ],
    certifications: ["Interaction Design — IDF"],
    bio: "Where pixels meet performance. I obsess over the in-betweens.",
  },
  {
    id: "6", name: "Vikram Singh", photo: avatar("Vikram"), company: "Tesla", role: "Embedded Engineer",
    batch: "2023", location: "Palo Alto, US",
    skills: ["Embedded C", "Robotics", "Firmware"],
    tech: ["C++", "Rust", "ROS", "Linux"],
    careerPath: [
      { year: "2016", role: "Hardware Intern", company: "Bosch" },
      { year: "2018", role: "Firmware Eng", company: "Ather Energy" },
      { year: "2022", role: "Embedded Engineer", company: "Tesla" },
    ],
    certifications: ["Embedded Linux — Bootlin"],
    bio: "Making electric vehicles think faster than you blink.",
  },
  {
    id: "7", name: "Kavya Nair", photo: avatar("Kavya"), company: "Notion", role: "Full-Stack Engineer",
    batch: "2024", location: "San Francisco, US",
    skills: ["Realtime Sync", "Editors", "DX"],
    tech: ["TypeScript", "Node", "Rust", "CRDTs"],
    careerPath: [
      { year: "2020", role: "Engineer", company: "Atlassian" },
      { year: "2023", role: "Full-Stack Engineer", company: "Notion" },
    ],
    certifications: ["Advanced React Patterns"],
    bio: "Collaborative software is the closest thing we have to magic.",
  },
  {
    id: "8", name: "Rohan Das", photo: avatar("Rohan"), company: "Linear", role: "Software Engineer",
    batch: "2025", location: "Berlin, DE",
    skills: ["Performance", "Animations", "Design Systems"],
    tech: ["TypeScript", "React", "GraphQL"],
    careerPath: [
      { year: "2022", role: "SDE", company: "Hotstar" },
      { year: "2024", role: "Software Engineer", company: "Linear" },
    ],
    certifications: ["Frontend Masters Pro"],
    bio: "60fps or it didn't happen.",
  },
];

export const QUOTES = [
  "The bridge between where you are and where you want to be is built by those who walked it first.",
  "Mentorship is the shortcut nobody talks about — until you find it.",
  "Every alumnus was once a student staring at the same horizon.",
  "Your network is your net worth — start building it today.",
  "Behind every great career is a community that believed first.",
];

export const HERO_SLIDES = [
  {
    title: "Find Your Mentor",
    subtitle: "Connect with alumni who walked the path you dream of walking.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Unlock Referrals",
    subtitle: "Get your resume into the right hands at the world's top companies.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Build Your Network",
    subtitle: "A single conversation can change the entire trajectory of your career.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Learn From The Best",
    subtitle: "Real stories. Real careers. Real advice — from people who've been there.",
    image: "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1600&q=80",
  },
];

export const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Zoho", "TCS", "Stripe", "Netflix", "Figma", "Notion", "Linear", "Tesla", "Meta",
];

export type MenteeRequest = {
  id: string;
  name: string;
  email: string;
  dept: string;
  semester: number;
  intent: "Referral" | "Mentoring";
  message: string;
  senderType?: "student" | "alumni";
  batch?: string;
};

export const MENTEE_REQUESTS: MenteeRequest[] = [
  { id: "r1", name: "Aarav Singh", email: "aarav@dept.edu", dept: "CS", semester: 5, intent: "Referral", message: "Looking for an SDE referral at Google.", senderType: "student" },
  { id: "r2", name: "Diya Patel", email: "diya@dept.edu", dept: "IT", semester: 6, intent: "Mentoring", message: "Want guidance on ML career path.", senderType: "student" },
  { id: "r3", name: "Karan Roy", email: "karan@dept.edu", dept: "ECE", semester: 4, intent: "Referral", message: "Frontend role referral request.", senderType: "student" },
  { id: "r4", name: "Meera Joshi", email: "meera@dept.edu", dept: "CS", semester: 7, intent: "Mentoring", message: "Need help preparing for system design interviews.", senderType: "student" },
  { id: "r5", name: "Rohit Kapoor", email: "rohit@flipkart.com", dept: "B.tech CYS", semester: 0, intent: "Mentoring", message: "Pivoting from backend to ML — would love your perspective.", senderType: "alumni", batch: "2018" },
  { id: "r6", name: "Tanvi Bhat", email: "tanvi@stripe.com", dept: "M.tech CYS", semester: 0, intent: "Referral", message: "Exploring a referral path into your team at Google.", senderType: "alumni", batch: "2020" },
];

