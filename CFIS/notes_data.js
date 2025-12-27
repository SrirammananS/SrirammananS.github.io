// Notes Configuration
const notesConfig = [
    // --- From list.json ---
    {
        id: 'pci1b',
        semester: 'Sem 1',
        subject: 'Network Protocols',
        title: 'Network and Communication Protocols',
        description: 'Important Questions for PCI1B.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1B%20Network%20and%20Communication%20Protocols.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1e',
        semester: 'Sem 1',
        subject: 'Cyber Crimes',
        title: 'Forms of Cyber Crimes',
        description: 'Important Questions for PCI1E.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1E%20Cyber%20Crimes.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1a',
        semester: 'Sem 1',
        subject: 'Criminology',
        title: 'Introduction to Cyber Criminology',
        description: 'Important Questions for PCI1A.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1A%20Cyber%20Criminology.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1d',
        semester: 'Sem 1',
        subject: 'IT Infra',
        title: 'IT Infrastructure and Cloud Computing',
        description: 'Important Questions on Cloud & Infra.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1D%20IT%20infra%20and%20Cloud%20Computing.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1c',
        semester: 'Sem 1',
        subject: 'Info Security',
        title: 'Introduction to Information Security',
        description: 'Important Questions for PCI1C.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1C%20Information%20Security.pdf',
        date: '2025-01-01'
    },
    {
        id: 'spci102',
        semester: 'Sem 1',
        subject: 'Network Protocols',
        title: 'Last Minute Revision',
        description: 'Most Important Topics for Network Protocols.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/SPCI102_Lastmin.pdf',
        date: '2025-01-01'
    },
    {
        id: 'net_html',
        semester: 'Sem 1',
        subject: 'Network Protocols',
        title: 'Keywords & Keys',
        description: 'Important questions with keys (HTML).',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Networking.html',
        date: '2025-01-01'
    },
    {
        id: 'net_sec',
        semester: 'Sem 2',
        subject: 'Security',
        title: 'Network Security and Cryptography',
        description: 'Protocols, crypto primitives, and secure architectures.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Network%20Security%20and%20Cryptography.pdf',
        date: '2025-01-01'
    },
    {
        id: 'forensics',
        semester: 'Sem 2',
        subject: 'Forensics',
        title: 'Basics of Cyber Forensics',
        description: 'Evidence handling, acquisition, and analysis fundamentals.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Basics%20of%20Cyber%20Forensics.pdf',
        date: '2025-01-01'
    },
    {
        id: 'telecom',
        semester: 'Sem 2',
        subject: 'Fraud Analysis',
        title: 'IT and Telecom Frauds',
        description: 'Fraud patterns and mitigations across telecom systems.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/IT%20AND%20TELECOM%20FRAUDS%20&%20COUNTERMEASURES.pdf',
        date: '2025-01-01'
    },
    {
        id: 'bfsi',
        semester: 'Sem 2',
        subject: 'Fraud Analysis',
        title: 'BFSI Frauds & Countermeasures',
        description: 'Threat landscape across banking and insurance verticals.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/BFSI%20FRAUDS%20&%20COUNTERMEASURES.pdf',
        date: '2025-01-01'
    },

    // --- Discovered Files ---
    {
        id: 'core2',
        semester: 'Sem 2',
        subject: 'Core',
        title: 'Core Paper II',
        description: 'Comprehensive study material for Core Paper II.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Core%20Paper%20II.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1a_guide',
        semester: 'Sem 1',
        subject: 'Criminology',
        title: 'Unit Wise Key Study Guide',
        description: 'PCI1A Cyber Criminology study guide.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Cyber%20Criminology%20Unit%20wise%20key%20Study%20Guide%20-%20PCI1A.pdf',
        date: '2025-01-01'
    },
    {
        id: 'forms_guide',
        semester: 'Sem 1',
        subject: 'Cyber Crimes',
        title: 'Forms of Cyber Crime Guide',
        description: 'Study guide for Forms of Cyber Crime.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Forms_of_Cyber_Crime_Study_Guide.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1c_notes',
        semester: 'Sem 1',
        subject: 'Info Security',
        title: 'Complete Study Notes',
        description: 'Detailed notes for PCI1C Information Security.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1C%20Information%20Security%20-%20Complete%20Study%20Notes%20(3).pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1d_10m',
        semester: 'Sem 1',
        subject: 'IT Infra',
        title: '10-Mark Questions',
        description: 'Short summary answers for PCI1D.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1D%2010-Mark%20Questions%20-%20Short%20Summary%20Answers.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1d_2m',
        semester: 'Sem 1',
        subject: 'IT Infra',
        title: '2-Mark Questions',
        description: 'Short answers for PCI1D.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1D%202-Mark%20Questions%20-%20Short%20Answers.pdf',
        date: '2025-01-01'
    },
    {
        id: 'pci1d_6m',
        semester: 'Sem 1',
        subject: 'IT Infra',
        title: '6-Mark Questions',
        description: 'Comprehensive answers for PCI1D.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/PCI1D%206-Mark%20Questions%20-%20Comprehensive%20Answers_till%203.pdf',
        date: '2025-01-01'
    },
    {
        id: 'syllabus',
        semester: 'Sem 1',
        subject: 'General',
        title: 'Syllabus',
        description: 'Course syllabus image.',
        pdfUrl: 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/Syllabus.jpg',
        date: '2025-01-01'
    }
];
