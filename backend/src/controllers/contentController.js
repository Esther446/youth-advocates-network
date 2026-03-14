exports.getGallery = (req, res) => {
    const galleryData = [
        { src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", title: "YAN National Summit 2024", location: "Kigali Convention Centre", description: "Youth leaders from across Rwanda gathered for the inaugural YAN summit", category: "events" },
        { src: "images/advocacy_workshop.png", title: "Advocacy Skills Workshop", location: "Huye District", description: "Capacity building session on youth policy advocacy", category: "training" },
        { src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600", title: "Community Health Outreach", location: "Musanze District", description: "OAZIS Health students engaging with local communities", category: "community" },
        { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600", title: "Leadership Roundtable", location: "Kigali, Rwanda", description: "YAN founders discussing strategic direction for 2025", category: "leadership" },
        { src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600", title: "UNICEF YAG Training", location: "Kigali, Rwanda", description: "The foundational training that sparked YAN's creation", category: "training" },
        { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", title: "Mental Health Awareness Day", location: "University of Rwanda", description: "MINDORA Health's campus mental wellness initiative", category: "events" },
        { src: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600", title: "Rural Community Visit", location: "Eastern Province", description: "Care & Help Child Organization reaching vulnerable children", category: "community" },
        { src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600", title: "Youth Innovation Challenge", location: "Kigali Innovation City", description: "Young entrepreneurs pitching sustainable solutions", category: "leadership" },
        { src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600", title: "Partner Coordination Meeting", location: "UNICEF Rwanda Office", description: "Strategic partnership planning with UNICEF and RBC", category: "events" }
    ];

    res.status(200).json({
        success: true,
        data: galleryData
    });
};

exports.getImpact = (req, res) => {
    const impactRatingsData = [
        {
            rating: "PLATINUM",
            organization: "Aspire Debate Rwanda",
            evidence: "Partnerships with 50+ secondary schools and 22 higher learning institutions; pioneered national and East African university debating championships; established since 2014 with systemic reach across Rwanda's education sector."
        },
        {
            rating: "PLATINUM",
            organization: "Informed Future Generations (IFG)",
            evidence: "Reached 5,000+ students through school clubs; collaborations with RBC and district governments; conducted 50+ outreaches; 40,000+ online views; founded in 2023 with remarkable rapid scaling."
        },
        {
            rating: "PLATINUM",
            organization: "Helping Heart Family Rwanda (HHFR)",
            evidence: "Supported 500+ children in education; legal aid to 10,000+ individuals; successfully reintegrated 50 former street children with families; founded in 2021 with deep, measurable community impact."
        },
        {
            rating: "GOLD",
            organization: "OAZIS Health",
            evidence: "Trained 850+ healthcare providers; engaged 500,000+ people in awareness campaigns; supported 720 digital health innovators; founded in 2020 with impressive scale in training and awareness."
        },
        {
            rating: "GOLD",
            organization: "Rwanda We Want Organization (RWW)",
            evidence: "Empowered 100+ graduates through leadership program; addressed intergenerational trauma for 126 individuals; reached 2,000+ youth with SRH education; registered NGO since 2015 with strong sustainability."
        },
        {
            rating: "GOLD",
            organization: "Care and Help Child Organization",
            evidence: "Expanded from supporting 35 to 574 vulnerable children; demonstrates powerful growth through partnerships; holistic approach to education, safety, and mental health with deep community roots since 2018."
        }
    ];

    res.status(200).json({
        success: true,
        data: impactRatingsData
    });
};
