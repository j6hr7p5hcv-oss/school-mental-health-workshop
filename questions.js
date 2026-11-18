// The first six questions identify perceived influencing factors.
// The final six explore evidence-aligned school leadership practices.
// This is a workshop discussion tool, not a validated mental-health assessment.
export const factorLabels = [
  { id:"academic", label:"Academic pressure", description:"Workload, examinations, performance expectations and fear of failure" },
  { id:"peer", label:"Peer relationships", description:"Friendships, bullying, exclusion, belonging and peer conflict" },
  { id:"family", label:"Family and home circumstances", description:"Family support, home stressors, responsibilities and stability" },
  { id:"school", label:"School climate and safety", description:"Physical and emotional safety, inclusion, fairness and school culture" },
  { id:"teacher", label:"Teacher relationships and support", description:"Trust, communication, teacher understanding and supportive relationships" },
  { id:"access", label:"Access to help and support", description:"Awareness, availability, accessibility and acceptability of support" }
];

export const leadershipDomains = [
  { id:"early", label:"Early identification", description:"Noticing concerns and responding supportively" },
  { id:"safeguarding", label:"Safeguarding and referral", description:"Responding promptly to risk and involving appropriate professionals" },
  { id:"privacy", label:"Privacy and trust", description:"Respectful communication and appropriate confidentiality" },
  { id:"equity", label:"Equity and access", description:"Making support accessible and fair to all students" },
  { id:"collaboration", label:"Collaboration and student voice", description:"Working with students, staff, families and qualified partners" },
  { id:"monitoring", label:"Monitoring and evaluation", description:"Using evidence and feedback to improve provision" }
];

export const questions = [
  { id:1, section:"Understanding Influencing Factors", group:"factors", prompt:"A student becomes increasingly anxious as examinations approach and says they are afraid of disappointing others. Which factor should the school explore first?", options:[
    ["A","Academic pressure and performance expectations"],
    ["B","Peer relationships and social belonging"],
    ["C","Family and home circumstances"],
    ["D","Access to support services"]
  ], factorMap:{A:"academic",B:"peer",C:"family",D:"access"} },
  { id:2, section:"Understanding Influencing Factors", group:"factors", prompt:"A student who used to participate actively has become withdrawn after repeated conflicts with classmates. Which possible influence is most directly suggested?", options:[
    ["A","Teacher communication and support"],
    ["B","Peer relationships, exclusion or bullying"],
    ["C","Academic workload"],
    ["D","Availability of support services"]
  ], factorMap:{A:"teacher",B:"peer",C:"academic",D:"access"} },
  { id:3, section:"Understanding Influencing Factors", group:"factors", prompt:"A student often arrives tired and struggles to concentrate because of responsibilities and stress outside school. Which area should leaders consider?", options:[
    ["A","School rules and discipline"],
    ["B","Peer competition"],
    ["C","Family and home circumstances"],
    ["D","Examination arrangements"]
  ], factorMap:{A:"school",B:"peer",C:"family",D:"academic"} },
  { id:4, section:"Understanding Influencing Factors", group:"factors", prompt:"Several students say they do not feel safe, included or respected in certain areas of the school. Which factor is most relevant?", options:[
    ["A","Academic expectations"],
    ["B","Family responsibilities"],
    ["C","Teacher workload"],
    ["D","School climate, safety and inclusion"]
  ], factorMap:{A:"academic",B:"family",C:"teacher",D:"school"} },
  { id:5, section:"Understanding Influencing Factors", group:"factors", prompt:"A student says they would like help but does not feel comfortable speaking to any teacher. Which possible influence should the school examine?", options:[
    ["A","Teacher–student trust and supportive relationships"],
    ["B","Peer competition"],
    ["C","Examination pressure"],
    ["D","Family responsibilities"]
  ], factorMap:{A:"teacher",B:"peer",C:"academic",D:"family"} },
  { id:6, section:"Understanding Influencing Factors", group:"factors", prompt:"Students are unsure where to go or whom to contact when they need emotional support. Which factor is most clearly indicated?", options:[
    ["A","Peer relationships"],
    ["B","Access to clear, appropriate support pathways"],
    ["C","Academic pressure"],
    ["D","School facilities"]
  ], factorMap:{A:"peer",B:"access",C:"academic",D:"school"} },

  { id:7, section:"School Leadership Practices", group:"leadership", domain:"early", correct:"C", prompt:"A teacher notices a student becoming unusually withdrawn. What is the most appropriate first response?", options:[
    ["A","Publicly ask the student to explain their behaviour."],
    ["B","Make a diagnosis based on the behaviour."],
    ["C","Approach the student privately, listen without judgement and follow the school's support procedures."],
    ["D","Wait until the student's academic results decline."]
  ]},
  { id:8, section:"School Leadership Practices", group:"leadership", domain:"safeguarding", correct:"B", prompt:"A student shares information that suggests an immediate risk to their safety. What should the school leader ensure happens?", options:[
    ["A","Promise to keep everything secret."],
    ["B","Follow safeguarding procedures immediately and refer the concern to the designated safeguarding lead and appropriate qualified services."],
    ["C","Ask classmates to monitor the student."],
    ["D","Wait for the next routine staff meeting."]
  ]},
  { id:9, section:"School Leadership Practices", group:"leadership", domain:"privacy", correct:"A", prompt:"How should staff handle sensitive information shared by a student?", options:[
    ["A","Share only with appropriate people who need the information to support or protect the student, following safeguarding policy."],
    ["B","Discuss it with colleagues who are not involved."],
    ["C","Share it with classmates so they can help."],
    ["D","Guarantee absolute confidentiality in every situation."]
  ]},
  { id:10, section:"School Leadership Practices", group:"leadership", domain:"equity", correct:"D", prompt:"Which approach best supports fair access to school wellbeing support?", options:[
    ["A","Offer help only to students who ask confidently in public."],
    ["B","Prioritise students with the highest examination scores."],
    ["C","Use one communication method for every student regardless of need."],
    ["D","Provide clear, accessible and discreet ways for all students to seek support, considering different needs and barriers."]
  ]},
  { id:11, section:"School Leadership Practices", group:"leadership", domain:"collaboration", correct:"B", prompt:"What is the strongest approach when developing a school mental health action plan?", options:[
    ["A","Allow one leader to make every decision without consultation."],
    ["B","Work with students, teachers, families and appropriate qualified professionals while respecting roles and privacy."],
    ["C","Transfer all responsibility to one classroom teacher."],
    ["D","Focus only on organising awareness events."]
  ]},
  { id:12, section:"School Leadership Practices", group:"leadership", domain:"monitoring", correct:"C", prompt:"Which approach provides the most useful evidence for reviewing a school wellbeing initiative?", options:[
    ["A","Count the number of posters displayed."],
    ["B","Use examination scores as the only measure."],
    ["C","Review appropriate indicators such as attendance patterns, student feedback, sense of safety, access to support and staff confidence."],
    ["D","Assume the initiative is successful once it has started."]
  ]}
];
