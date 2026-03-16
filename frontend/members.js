const membersData = [
    {
        name: "CARE AND HELP CHILD ORGANIZATION",
        founder: "GATSINZI Gloria",
        country: "Rwanda",
        focus: ["Health", "Education", "Child Right"],
        description: "Ensuring safety, fostering mental well-being, and empowering young minds to build brighter futures.",
        profile: "profiles/careandhelp.html",
        image: "images/Gloria.jpeg"
    },
    {
        name: "WHAT IF-RWANDA",
        founder: "Silas",
        country: "Rwanda",
        focus: ["Child Right", "Education"],
        description: "Installing water filtration systems and providing consistent mentorship for children at Iramiro Center.",
        profile: "profiles/whatif.html",
        image: "images/Silas.jpg"
    },
    {
        name: "ASPIRE DEBATE RWANDA",
        founder: "Professional Member",
        country: "Rwanda",
        focus: ["Education", "Leadership"],
        description: "Unleashing the power of the youth voice through transformative debate education since 2014.",
        profile: "profiles/aspiredebate.html",
        image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80"
    },
    {
        name: "INFORMED FUTURE GENERATIONS",
        founder: "KWIBUKA Jacques",
        country: "Rwanda",
        focus: ["Awareness", "Youth Empowerment", "Equality"],
        description: "Challenging harmful social norms through the 'Like Your Sister' program in Eastern Province.",
        profile: "profiles/informedfuturegenerations.html",
        image: "images/Kwibuka.jpeg"
    },
    {
        name: "OAZIS HEALTH",
        founder: "Youth Innovator",
        country: "Rwanda",
        description: "Bridging healthcare gaps for marginalized communities through dynamic grassroots innovation.",
        focus: ["Health", "Equity"],
        profile: "profiles/oazishealth.html",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80"
    },
    {
        name: "HELPING HEART FAMILY RWANDA",
        founder: "RWIKAZA Gentil",
        country: "Rwanda",
        description: "Building communities where every child's rights are fiercely respected and equally provided.",
        focus: ["Family Support", "Legal Aid", "Education"],
        profile: "profiles/helpingheartfamily.html",
        image: "images/Gentil.jpeg"
    },
    {
        name: "RWANDA WE WANT ORGANIZATION",
        founder: "MURENZI Tristan",
        country: "Rwanda",
        description: "Empowering youth through leadership programs to drive sustainable development across Rwanda.",
        focus: ["Governance", "Youth Leadership"],
        profile: "profiles/rwandaweWant.html",
        image: "images/Murenzi.jpeg"
    },
    {
        name: "HEZA INITIATIVE",
        founder: "NDUWAYEZU Samuel",
        country: "Rwanda",
        description: "Cultivating maternal and child health through nutrition, agriculture, and empowerment.",
        focus: ["Nutrition", "Health", "Youth Empowerment"],
        profile: "profiles/hezainitiative.html",
        image: "images/Samuel.jpeg"
    },
    {
        name: "URPHSA",
        founder: "Student Leaders",
        country: "Rwanda",
        description: "Bridging the gap between academic knowledge and real-world health impact since 2017.",
        focus: ["Public Health", "Advocacy"],
        profile: "profiles/urphsa.html",
        image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80"
    },
    {
        name: "RISE AND LIVE ORGANIZATION",
        founder: "AKARIZA Laurette",
        country: "Rwanda",
        description: "Equipping teen mothers with mental resilience and reproductive health education to lead fulfilling lives.",
        focus: ["Mental Health", "Youth Empowerment"],
        profile: "profiles/riseandlive.html",
        image: "images/Laurette.jpeg"
    },
    {
        name: "NURSING RESEARCH CLUB",
        founder: "Nursing Researchers",
        country: "Rwanda",
        description: "Advancing community health through rigorous research and evidence-based clinical practices.",
        focus: ["Health", "Research"],
        profile: "profiles/nursingresearchclub.html",
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80"
    },
    {
        name: "INSHUTI HEALTH ORGANIZATION",
        founder: "NSHUTI Winny",
        country: "Rwanda",
        description: "Transforming lives in Nyagatare through health equity and empowering economic opportunities.",
        focus: ["Health", "Community Empowerment"],
        profile: "profiles/inshutihealth.html",
        image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&q=80"
    },
    {
        name: "MINDORA HEALTH",
        founder: "Kwizera",
        country: "Rwanda",
        description: "Delivering mental health and wellbeing support through AI-driven guidance and youth programs.",
        focus: ["Mental Health", "Tech For Good"],
        profile: "profiles/mindorahealth.html",
        image: "images/Kwizera.jpg"
    },
    {
        name: "HOPE FOR TOMORROW",
        founder: "Community Builders",
        country: "Rwanda",
        description: "Empowering youths in Nyamasheke through targeted community support and scholarships.",
        focus: ["Scholarships", "Youth Empowerment"],
        profile: "profiles/hopefortomorrow.html",
        image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&q=80"
    },
    {
        name: "BREAKING SILENCE",
        founder: "KABERA Vidha",
        country: "Rwanda",
        description: "Mental Health Youth Advocate working to normalize conversations among the younger generation.",
        focus: ["Awareness", "Mental Health"],
        profile: "profiles/breakingsilence.html",
        image: "images/Vidha.jpg"
    }
];

function getInitials(name) {
    const cleaned = (name || "").trim().replace(/[^A-Za-z0-9\s]/g, "");
    const parts = cleaned.split(/\s+/).filter(Boolean);

    const a = (parts[0] || "").charAt(0);
    const b = (parts[1] || parts[0] || "").charAt(0);
    return (a + b).toUpperCase();
}

function renderMembersList(list) {
    const listEl = document.getElementById("membersList");

    if (!listEl) return;

    if (!list.length) {
        listEl.innerHTML = `<div class="emptyState">No members found matching your search.</div>`;
        return;
    }

    listEl.innerHTML = list.map((m, index) => `
    <article class="member-card" style="--delay: ${index * 0.1}s">
      <div class="member-card-inner">
        <div class="member-image-wrapper">
          <img src="${m.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400'}" alt="${m.founder}" class="member-image" loading="lazy">
          <div class="member-image-overlay"></div>
          <div class="member-initials">${getInitials(m.name)}</div>
        </div>
        
        <div class="member-details">
          <div class="member-header">
            <h3 class="member-org-name">${m.name}</h3>
            <span class="member-country">${m.country || 'Rwanda'}</span>
          </div>
          
          <p class="member-founder">Founder: <span>${m.founder || 'Member Organization'}</span></p>
          <p class="member-bio">${m.description}</p>
          
          <div class="member-tags">
            ${(m.focus || []).slice(0, 3).map(f => `<span class="member-tag">${f}</span>`).join("")}
          </div>
          
          <div class="member-footer">
            <a class="view-profile-btn" href="${m.profile || '#'}" target="_blank" rel="noopener noreferrer">
              Explore Impact
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function applyMembersSearch() {
    const searchEl = document.getElementById("memberSearch");
    const q = (searchEl?.value || "").toLowerCase().trim();

    if (!q) {
        return renderMembersList(membersData);
    }

    const filtered = membersData.filter(m => {
        const hay = `${m.name} ${m.description} ${(m.focus || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
    });

    renderMembersList(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize members rendering
    renderMembersList(membersData);

    // Attach search listener
    const searchInput = document.getElementById("memberSearch");
    if (searchInput) {
        searchInput.addEventListener("input", applyMembersSearch);
    }

    // Hamburger menu inside Members Page (reused logic)
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Scroll effect for navbar
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});
