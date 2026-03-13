// src/data/curriculum.js
// Full B.Tech CSE 2023 curriculum from Amrita School of Engineering

export const SEMESTERS = {
  "Semester I": [
    { code: "23ENG101", title: "Technical Communication",               credits: 3, cat: "HUM" },
    { code: "23MAT107", title: "Calculus",                              credits: 4, cat: "SCI" },
    { code: "23CSE101", title: "Computational Problem Solving",         credits: 4, cat: "CSE" },
    { code: "23EEE104", title: "Intro to Electrical & Electronics Engg",credits: 3, cat: "ENGG" },
    { code: "23EEE184", title: "Basic EEE Practice Lab",                credits: 1, cat: "ENGG" },
    { code: "23CSE102", title: "Computer Hardware Essentials",          credits: 2, cat: "ENGG" },
    { code: "22ADM101", title: "Foundations of Indian Heritage",        credits: 2, cat: "HUM" },
    { code: "22AVP103", title: "Mastery Over Mind",                     credits: 2, cat: "HUM" },
  ],
  "Semester II": [
    { code: "23MAT116", title: "Discrete Mathematics",                  credits: 4, cat: "SCI" },
    { code: "23MAT117", title: "Linear Algebra",                        credits: 4, cat: "SCI" },
    { code: "23CSE111", title: "Object Oriented Programming",           credits: 4, cat: "CSE" },
    { code: "23PHY115", title: "Modern Physics",                        credits: 3, cat: "SCI" },
    { code: "23CSE113", title: "User Interface Design",                 credits: 3, cat: "CSE" },
    { code: "23MEE115", title: "Manufacturing Practice",                credits: 1, cat: "ENGG" },
    { code: "22ADM111", title: "Glimpses of Glorious India",            credits: 2, cat: "HUM" },
  ],
  "Semester III": [
    { code: "23MAT206", title: "Optimization Techniques",               credits: 4, cat: "SCI" },
    { code: "23CSE205", title: "Digital Electronics",                   credits: 3, cat: "ENGG" },
    { code: "23CSE201", title: "Procedural Programming using C",        credits: 4, cat: "CSE" },
    { code: "23CSE202", title: "Database Management Systems",           credits: 4, cat: "CSE" },
    { code: "23CSE203", title: "Data Structures and Algorithms",        credits: 5, cat: "CSE" },
    { code: "23CSE285", title: "Digital Electronics Laboratory",        credits: 1, cat: "ENGG" },
  ],
  "Semester IV": [
    { code: "23MAT216", title: "Probability and Random Processes",      credits: 4, cat: "SCI" },
    { code: "23CSE211", title: "Design and Analysis of Algorithms",     credits: 4, cat: "CSE" },
    { code: "23CSE212", title: "Principles of Functional Languages",    credits: 3, cat: "CSE" },
    { code: "23CSE213", title: "Computer Organization and Architecture",credits: 4, cat: "ENGG" },
    { code: "23CSE214", title: "Operating Systems",                     credits: 4, cat: "CSE" },
  ],
  "Semester V": [
    { code: "23CSE301", title: "Machine Learning",                      credits: 4, cat: "CSE" },
    { code: "23CSE302", title: "Computer Networks",                     credits: 5, cat: "CSE" },
    { code: "23CSE303", title: "Theory of Computation",                 credits: 4, cat: "CSE" },
    { code: "23CSE304", title: "Embedded Systems",                      credits: 4, cat: "ENGG" },
  ],
  "Semester VI": [
    { code: "23CSE311", title: "Software Engineering",                  credits: 4, cat: "ENGG" },
    { code: "23CSE312", title: "Distributed Systems",                   credits: 4, cat: "ENGG" },
    { code: "23CSE313", title: "Foundations of Cyber Security",        credits: 3, cat: "CSE" },
    { code: "23CSE314", title: "Compiler Design",                       credits: 4, cat: "CSE" },
    { code: "23CSE399", title: "Project Phase-I",                       credits: 3, cat: "PRJ" },
  ],
  "Semester VII": [
    { code: "23CSE401", title: "Fundamentals of Artificial Intelligence",credits: 3, cat: "CSE" },
    { code: "23CSE498", title: "Project Phase-II",                      credits: 6, cat: "PRJ" },
  ],
  "Semester VIII": [
    { code: "23CSE499", title: "Project Phase-III",                     credits: 6, cat: "PRJ" },
  ],
};

export const ELECTIVES = {
  "Cyber Security": [
    { code: "23CSE331", title: "Cryptography" },
    { code: "23CSE332", title: "Information Security" },
    { code: "23CSE333", title: "Secure Coding" },
    { code: "23CSE334", title: "Cyber Forensics and Malware" },
    { code: "23CSE335", title: "Blockchain and its Applications" },
    { code: "23CSE336", title: "Secure Networks" },
  ],
  "Computer Networks": [
    { code: "23CSE341", title: "Wireless Sensor Networks" },
    { code: "23CSE342", title: "Advanced Computer Networks" },
    { code: "23CSE343", title: "Wireless and Mobile Networks" },
    { code: "23CSE344", title: "Modern Cellular Wireless Networks" },
    { code: "23CSE345", title: "Software Defined Networks" },
  ],
  "Data Science": [
    { code: "23CSE351", title: "Foundations of Data Science" },
    { code: "23CSE352", title: "Big Data Analytics" },
    { code: "23CSE353", title: "Data Visualization" },
    { code: "23CSE354", title: "DBMS for Data Science" },
    { code: "23CSE355", title: "Mining of Massive Datasets" },
    { code: "23CSE356", title: "Social Network Analytics" },
    { code: "23CSE357", title: "Time Series Analysis and Forecasting" },
  ],
  "Cyber Physical Systems": [
    { code: "23CSE361", title: "RT OS for Cyber-Physical Systems" },
    { code: "23CSE362", title: "Edge Computing" },
    { code: "23CSE363", title: "Cloud Computing" },
    { code: "23CSE364", title: "Cyber Physical Systems" },
    { code: "23CSE365", title: "Internet of Things" },
  ],
  "Computer Vision": [
    { code: "23CSE371", title: "Digital Image Processing" },
    { code: "23CSE372", title: "Computer Graphics and Animation" },
    { code: "23CSE373", title: "Computer Vision" },
    { code: "23CSE374", title: "Video Analysis" },
    { code: "23CSE375", title: "Augmented and Virtual Reality" },
  ],
  "Artificial Intelligence": [
    { code: "23CSE470", title: "Semantic Web" },
    { code: "23CSE471", title: "Natural Language Processing" },
    { code: "23CSE472", title: "Artificial Intelligence and Robotics" },
    { code: "23CSE473", title: "Neural Networks and Deep Learning" },
    { code: "23CSE474", title: "Computational Intelligence" },
    { code: "23CSE475", title: "Generative AI" },
    { code: "23CSE476", title: "Conversational AI" },
    { code: "23CSE477", title: "Reinforcement Learning" },
    { code: "23CSE478", title: "Drones and Robotics" },
    { code: "23CSE479", title: "Machine Learning with Graphs" },
    { code: "23CSE480", title: "AI for Industrial Decision Making" },
  ],
  "General Electives": [
    { code: "23CSE451", title: "Graph Mining" },
    { code: "23CSE452", title: "Business Analytics" },
    { code: "23CSE453", title: "Competitive Programming" },
    { code: "23CSE454", title: "Concurrent Programming" },
    { code: "23CSE455", title: "Design Patterns" },
    { code: "23CSE460", title: "Features in Modern Programming Languages" },
    { code: "23CSE461", title: "Full Stack Frameworks" },
    { code: "23CSE463", title: "Quantum Computing" },
    { code: "23CSE465", title: "Mobile Application Development" },
    { code: "23CSE466", title: "Parallel Programming" },
  ],
};

// Flat list — every course (core + electives)
export const ALL_COURSES = [
  ...Object.entries(SEMESTERS).flatMap(([sem, courses]) =>
    courses.map(c => ({ ...c, semester: sem, isElective: false }))
  ),
  ...Object.entries(ELECTIVES).flatMap(([track, courses]) =>
    courses.map(c => ({ ...c, credits: 3, cat: "CSE", semester: `Elective – ${track}`, isElective: true }))
  ),
];

export const getCourse = (code) => ALL_COURSES.find(c => c.code === code);
