import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.challenges.models import Category, Tag, Challenge, Follow
from apps.solutions.models import Solution, SolutionRevision
from apps.engagement.models import Comment, Vote
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with demo data (5 users, 6 categories, 10 tags, 20 challenges, 40 solutions, etc.)"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Clearing existing data...")
        Notification.objects.all().delete()
        Vote.objects.all().delete()
        Comment.objects.all().delete()
        SolutionRevision.objects.all().delete()
        Solution.objects.all().delete()
        Follow.objects.all().delete()
        Challenge.objects.all().delete()
        Tag.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Creating users...")
        users_data = [
            {
                "username": "arjun_sharma",
                "email": "arjun@example.com",
                "bio": "Civic tech enthusiast & urban planner living in Bangalore.",
                "location": "Bangalore, India",
                "reputation": 145,
            },
            {
                "username": "priya_patel",
                "email": "priya@example.com",
                "bio": "Environmental activist and community organizer passionate about clean streets.",
                "location": "Mumbai, India",
                "reputation": 95,
            },
            {
                "username": "rahul_verma",
                "email": "rahul@example.com",
                "bio": "Software engineer interested in IoT for public governance and safety.",
                "location": "New Delhi, India",
                "reputation": 210,
            },
            {
                "username": "ananya_deshmukh",
                "email": "ananya@example.com",
                "bio": "Architecture student keen on pedestrian-first neighborhood design.",
                "location": "Pune, India",
                "reputation": 60,
            },
            {
                "username": "vikram_singh",
                "email": "vikram@example.com",
                "bio": "Local resident council member and renewable energy advocate.",
                "location": "Jaipur, India",
                "reputation": 130,
            },
        ]

        users = []
        for udata in users_data:
            user = User.objects.create_user(
                username=udata["username"],
                email=udata["email"],
                password="password123",
                bio=udata["bio"],
                location=udata["location"],
                reputation=udata["reputation"],
            )
            users.append(user)

        # Ensure a superuser / admin exists
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@commonground.org", "is_staff": True, "is_superuser": True},
        )
        admin_user.set_password("admin123")
        admin_user.save()

        self.stdout.write("Creating categories...")
        categories_data = [
            ("Infrastructure & Roads", "infrastructure-roads", "road"),
            ("Environment & Greenery", "environment-greenery", "leaf"),
            ("Public Safety & Lighting", "public-safety-lighting", "shield"),
            ("Health & Sanitation", "health-sanitation", "heart-pulse"),
            ("Education & Youth", "education-youth", "book-open"),
            ("Civic Amenities & Water", "civic-amenities-water", "droplets"),
        ]
        categories = [
            Category.objects.create(name=name, slug=slug, icon=icon)
            for name, slug, icon in categories_data
        ]

        self.stdout.write("Creating tags...")
        tag_names = [
            "lighting", "traffic", "cleanliness", "parks", "solar",
            "roads", "waste-management", "water-supply", "pedestrian", "air-quality",
        ]
        tags = [Tag.objects.create(name=name, slug=name) for name in tag_names]

        self.stdout.write("Creating challenges...")
        challenge_samples = [
            ("Broken streetlights on Model Town 4th Avenue",
             "Streetlights along the 1.5 km stretch between 4th Avenue and the metro station have been non-functional for 3 weeks, creating safety risks for evening commuters.",
             0, [0, 2], "Model Town Road, Sector 14", "open"),
            ("Severe waterlogging near Central Market underpass",
             "Every monsoon storm floods the underpass under Central Market with up to 2 feet of stagnant water, halting all pedestrian and light motor vehicle traffic.",
             0, [1, 5, 8], "Central Market Underpass", "in_progress"),
            ("Overflowing garbage bins outside Community Park",
             "Municipal waste collection has been irregular, resulting in foul odor, stray animal disturbance, and litter covering the entrance to the children's park.",
             3, [2, 6], "Green Park Sector 9", "proposed"),
            ("Unregulated speeding near St. Jude Public School",
             "Vehicles exceed speed limits during school drop-off and pickup hours due to lack of speed breakers or pedestrian crossings.",
             2, [1, 8], "St. Jude Avenue, North Block", "resolved"),
            ("Neglected public park with broken benches and dead trees",
             "The 2-acre neighborhood park has zero lighting, unkempt weeds, broken jogging track tiles, and no dustbins.",
             1, [3, 2], "Shanti Vihar Pocket B", "proposed"),
            ("Frequent drinking water contamination in Block C",
             "Residents report muddy, foul-smelling tap water intermittently during morning supply hours for the past 10 days.",
             5, [7], "Civil Lines, Block C", "open"),
            ("Lack of designated cycling tracks on Ring Road",
             "Cyclists and e-bike riders are forced into mixed heavy traffic lanes, leading to frequent near-miss collisions during rush hour.",
             0, [1, 8], "Outer Ring Road Stretch 5", "proposed"),
            ("Absence of public restrooms near bustling bus terminal",
             "Over 10,000 daily commuters use the East End terminal, yet the nearest functioning toilet facility is over 800m away.",
             3, [2], "East End Bus Terminal", "in_progress"),
            ("Dust pollution from uncovered construction materials",
             "Major residential projects leave sand and cement piles uncovered on the pavement, spiking PM2.5 levels locally.",
             1, [9, 2], "Cyber City Phase 2", "open"),
            ("Stray cattle blocking arterial highway intersection",
             "Unattended cows and bullocks congregate on the road island, causing frequent sudden braking and traffic bottlenecks.",
             0, [1], "Old Highway Junction 12", "open"),
            ("Damaged footbridge over Railway Line connecting Sector 8 & 9",
             "Several iron plates on the pedestrian overpass are loose and rusting through, endangering hundreds of daily school children.",
             0, [8], "Railway Crossing Kilometre 42", "in_progress"),
            ("Need for solar streetlights in un-electrified slum resettlement area",
             "A recently established colony lacks electrical grid poles. Installing decentralized solar lights would immediately reduce nighttime crime.",
             2, [0, 4], "Navjeevan Basti, Ward 11", "proposed"),
            ("No accessible ramps for wheelchairs at District Library",
             "The public library entrance has 12 steep steps with no ramp or elevator access, locking out persons with disabilities.",
             4, [8], "Civil Court Road", "resolved"),
            ("Illegal dumping of electronic waste along canal bank",
             "Discarded batteries and circuit boards are being dumped along the irrigation canal, contaminating downstream groundwater.",
             1, [6, 7], "Western Canal Bank Rd", "open"),
            ("Pothole cluster at Main Market intersection causing accidents",
             "Deep craters formed after recent pipeline digging remain unpaved, causing multiple two-wheeler skids each week.",
             0, [5, 1], "Main Bazaar Chowk", "proposed"),
            ("Inadequate bus frequency during early morning shift hours",
             "Factory workers and domestic helpers wait over 45 minutes for route 402 between 5:30 AM and 7:00 AM.",
             0, [1], "Industrial Area Gate 3", "open"),
            ("Open drainage trench without protective railings near playground",
             "A 5-foot-deep municipal storm drain runs exposed right alongside the municipal football ground.",
             3, [2, 7], "Vidyapeeth Colony Ground", "in_progress"),
            ("Lack of after-school learning center for underprivileged children",
             "Children in the resettlement colony have no quiet space with books or internet access to complete homework.",
             4, [], "Bapu Nagar Community Hall", "proposed"),
            ("Dying urban lake due to unchecked sewage inflow",
             "Untreated graywater from nearby unauthorized residential layouts has led to massive algal bloom in Lotus Lake.",
             1, [7, 3], "Lotus Lake Wetland Area", "in_progress"),
            ("Excessive noise pollution from unregistered banquets near residential zones",
             "Loudspeakers and fireworks operate well past midnight on weekdays, disrupting students and senior citizens.",
             2, [], "Shalimar Enclave", "open"),
        ]

        challenges = []
        for i, (title, desc, cat_idx, tag_indices, loc, stat) in enumerate(challenge_samples):
            author = users[i % len(users)]
            cat = categories[cat_idx]
            ch = Challenge.objects.create(
                author=author,
                title=title,
                description=desc,
                category=cat,
                location=loc,
                status=stat,
                support_count=random.randint(4, 25),
            )
            if tag_indices:
                ch.tags.set([tags[ti] for ti in tag_indices if ti < len(tags)])
            challenges.append(ch)

        self.stdout.write("Creating solutions (40 total)...")
        solution_data = [
            ("Deploy solar-powered standalone LED fixtures with smart dimming",
             "Install 15 independent solar poles along the 1.5km unlit stretch. Uses lithium-ion batteries and light sensors to reduce nighttime power drain.",
             "₹1,20,000", "med"),
            ("Reroute municipal patrol van with portable spotlight until grid fix",
             "Petition the local police beat to station a mobile light tower between 7 PM and 11 PM daily.",
             "₹5,000 / month", "low"),
            ("High-capacity submersible sump pump with automated float switch",
             "Install a dual 5 HP pump set in the underpass catchment well with automated float activation to clear water in under 15 minutes.",
             "₹85,000", "med"),
            ("Construct gravel retention french-drain on roadside verge",
             "Excavate a 1m x 50m percolation trench along the market boundary to divert runoff before it reaches the underpass.",
             "₹40,000", "med"),
            ("Install dual compactor bins with IoT fullness alert sensor",
             "Partner with an NGO to pilot 2 solar-compacting bins that alert waste contractors once 80% capacity is reached.",
             "₹60,000", "low"),
            ("Organize weekend community cleanliness drive and signage campaign",
             "Mobilize local resident youth for Sunday cleanups and paint colorful awareness murals around the park fence.",
             "₹3,000", "low"),
            ("Rubber speed humps conforming to IRC standards with cat-eyes",
             "Install 2 standardized rumble strips and 1 elevated zebra table directly opposite the school entry gate.",
             "₹25,000", "low"),
            ("Deploy student road-safety volunteer corps for peak hours",
             "Train senior students and NCC cadets as crossing marshals with high-vis vests and handheld stop paddles.",
             "₹2,000", "low"),
            ("Neighborhood adopt-a-park initiative with private nursery sponsorship",
             "Grant garden maintenance rights to a nearby nursery in return for modest promotional branding on planter boxes.",
             "Free / Sponsored", "med"),
            ("Install drip irrigation using treated greywater for park plants",
             "Set up a decentralized reed-bed filter to polish greywater from the community center for plant watering.",
             "₹35,000", "high"),
            ("UV disinfection and backwash filtration unit at overhead reservoir",
             "Retrofit the municipal booster station with continuous online chlorine dosing and inline sediment filtration.",
             "₹70,000", "med"),
            ("Bi-weekly citizen water testing kit and transparent noticeboard",
             "Empower residents with rapid chemical test strips; post results on a community WhatsApp channel and physical board.",
             "₹4,000", "low"),
            ("Bollard-protected segregated 1.8m cycle lane with green paint",
             "Reclaim the outer shoulder of the ring road using concrete bollards and thermoplastic reflective paint.",
             "₹2,50,000 / km", "high"),
            ("Community bike bus schedule for morning office commute",
             "Coordinate group cycling pods with scheduled meetup points to ensure safety in numbers without road redesign.",
             "Free", "low"),
            ("Prefabricated modular e-toilet pod managed via QR ticketing",
             "Procure an automated self-cleaning stainless steel toilet kiosk with digital payments.",
             "₹1,80,000", "med"),
            ("Lease vacant railway parcel for pay-and-use hygiene complex",
             "Apply for single-window permit from Railways to install a mobile containerized sanitation block.",
             "₹1,10,000", "high"),
            ("Mandatory geotagged sprinkler audit for private contractors",
             "Municipal enforcement requiring active water misters on scaffolding and fine on dry material transport.",
             "Administrative", "low"),
            ("Install green privacy netting around construction perimeter",
             "Enforce 12-foot agro-netting on all boundary fences to trap airborne cement particulates.",
             "₹15,000 / site", "low"),
            ("Cooperative cattle shelter agreement with peripheral gaushalas",
             "Contract local milk cooperative to run a micro-shelter with subsidized fodder supply outside town limits.",
             "₹20,000 / month", "med"),
            ("Tag and microchip cattle with punitive owner registry",
             "RFID ear-tagging for municipal registration; levy escalating fines whenever tagged animals wander on highways.",
             "₹50 / animal", "low"),
            ("Reinforced steel plate welding with non-slip epoxy coating",
             "Temporary structural reinforcement of overpass deck with checker plates before complete cantilever overhaul.",
             "₹55,000", "med"),
            ("Pedestrian subway with CCTV and emergency SOS buttons",
             "Long-term proposal for an underground box-culvert pass avoiding high-voltage overhead railway tracks.",
             "₹45,00,000", "high"),
            ("Decentralized solar micro-grid with smart prepaid meters",
             "Rooftop solar installation on the community hall feeding 30 street poles and 4 communal water taps.",
             "₹3,20,000", "high"),
            ("Community battery bank charged via shared solar pergola",
             "A shaded gathering gazebo with a 5kW solar canopy providing evening emergency illumination.",
             "₹90,000", "med"),
            ("Modular steel wheelchair ramp with dual-height stainless steel handrails",
             "Bolt-on ramp complying with accessibility standards directly over existing terrace stairs.",
             "₹42,000", "low"),
            ("Vertical platform lift adjacent to library foyer",
             "Electric screw-drive disabled elevator for smooth unassisted entry.",
             "₹1,50,000", "med"),
            ("Periodic authorized e-waste collection kiosk with buyback points",
             "Tie-up with government-certified recycler; distribute coupons redeemable at local grocers for old electronics.",
             "Self-sustaining", "low"),
            ("CCTV camera surveillance and heavy punitive municipal fines",
             "Solar CCTV installation focused on canal blind spots to capture license plates of dumping vehicles.",
             "₹30,000", "low"),
            ("Cold-mix asphalt rapid patching kit for pothole restoration",
             "Deploy ready-to-use cold bituminous mix compacted by a walk-behind vibrating roller within 24 hours.",
             "₹18,000", "low"),
            ("Paver block interlocking retrofit at high-impact junction",
             "Replace crumbling bitumen with heavy-duty M50 interlocking paver blocks that withstand heavy bus braking.",
             "₹80,000", "med"),
            ("Introduce 2 mini electric feeder buses on 15-minute headway",
             "Lease 24-seater e-buses connecting the industrial estate gate with suburban train station.",
             "₹15,00,000", "high"),
            ("Carpool dispatch board outside worker residential blocks",
             "Designated pickup bays for shared e-rickshaws with fixed ₹10 fare agreements.",
             "Negligible", "low"),
            ("Chain-link safety fence with concrete curb base along drain",
             "Install 6-foot galvanized chain link fencing anchored in a 1-foot concrete sill along the full 120m stretch.",
             "₹38,000", "med"),
            ("Precast RCC slab box covering over the open section",
             "Cover the trench using perforated heavy-duty concrete slabs that double as spectator seating.",
             "₹95,000", "high"),
            ("Convert idle Panchayat storage shed into solar-lit study hub",
             "Refurbish empty municipal room with desks, whiteboards, LED tubes, and 2 donated refurbished desktop PCs.",
             "₹22,000", "low"),
            ("Evening volunteer tutoring cohort led by college students",
             "Enlist NSS student volunteers for 2-hour daily reading and mathematics coaching sessions.",
             "Free", "low"),
            ("Floating wetland bio-remediation islands using vetiver grass",
             "Build floating bamboo rafts planted with canna indica and vetiver to naturally uptake nitrates and phosphorus.",
             "₹45,000", "med"),
            ("Aeration fountains powered by rooftop wind-solar hybrid turbine",
             "Install 2 surface aerators to increase dissolved oxygen levels and eliminate mosquito breeding.",
             "₹1,20,000", "med"),
            ("Deploy automated sound-level decibel loggers with SMS trigger",
             "Position calibrated IoT noise sensors near wedding halls that trigger immediate police alert past 10 PM.",
             "₹25,000", "low"),
            ("Mandatory indoor acoustic baffling for banquet venues",
             "Require venue owners to install double-glazed soundproof glass and interior sound absorption panels.",
             "Private cost", "med"),
        ]

        solutions = []
        for i, (title, summ, cost, effort) in enumerate(solution_data):
            challenge = challenges[i % len(challenges)]
            author = users[(i + 1) % len(users)]
            if author == challenge.author:
                author = users[(i + 2) % len(users)]

            is_accepted = False
            if challenge.status in (Challenge.Status.IN_PROGRESS, Challenge.Status.RESOLVED):
                # accept only one solution per in_progress or resolved challenge
                if not Solution.objects.filter(challenge=challenge, is_accepted=True).exists():
                    is_accepted = True

            sol = Solution.objects.create(
                challenge=challenge,
                author=author,
                title=title,
                summary=summ,
                estimated_cost=cost,
                effort_level=effort,
                score=random.randint(2, 18),
                is_accepted=is_accepted,
            )
            solutions.append(sol)

            # Add a revision to some solutions
            if i % 3 == 0:
                SolutionRevision.objects.create(
                    solution=sol,
                    editor=users[(i + 3) % len(users)],
                    content=summ + "\n\n*Updated with revised component specifications and estimated lead times.*",
                    note="Refined technical details based on civil engineer feedback.",
                )

        self.stdout.write("Creating follows...")
        for ch in challenges:
            for u in random.sample(users, k=3):
                Follow.objects.get_or_create(user=u, challenge=ch)

        self.stdout.write("Creating comments...")
        comment_texts = [
            "This has been a massive issue during morning hours. Glad someone documented it with precise coordinates!",
            "I spoke with the junior engineer at the ward office yesterday; they claimed funds were sanctioned last month.",
            "Can we also look into whether solar alternatives would be cheaper in the long run?",
            "Fully endorse this solution. The proposed budget is very realistic and matches previous ward projects.",
            "Great initiative! Happy to volunteer for the survey and execution team on weekends.",
        ]

        for i, ch in enumerate(challenges[:12]):
            c1 = Comment.objects.create(
                author=users[(i + 1) % len(users)],
                challenge=ch,
                body=comment_texts[i % len(comment_texts)],
            )
            # Add reply
            Comment.objects.create(
                author=users[(i + 2) % len(users)],
                challenge=ch,
                parent=c1,
                body="Agreed! Let's present this collectively at the next Ward Committee meeting.",
            )

        for i, sol in enumerate(solutions[:15]):
            Comment.objects.create(
                author=users[(i + 2) % len(users)],
                solution=sol,
                body="The cost estimation here is very well thought out. Has the team verified warranty terms?",
            )

        self.stdout.write("Creating votes...")
        for ch in challenges:
            for u in users:
                if u != ch.author and random.random() > 0.3:
                    Vote.objects.get_or_create(user=u, challenge=ch, defaults={"value": 1})

        for sol in solutions:
            for u in users:
                if u != sol.author and random.random() > 0.4:
                    val = 1 if random.random() > 0.1 else -1
                    Vote.objects.get_or_create(user=u, solution=sol, defaults={"value": val})

        self.stdout.write("Creating notifications...")
        for u in users:
            Notification.objects.create(
                recipient=u,
                actor=users[0] if u != users[0] else users[1],
                verb="supported your challenge",
                target_type="challenge",
                target_id=challenges[0].id,
                challenge=challenges[0],
                is_read=random.choice([True, False]),
            )
            Notification.objects.create(
                recipient=u,
                actor=users[2] if u != users[2] else users[3],
                verb="proposed a solution for",
                target_type="solution",
                target_id=solutions[0].id,
                challenge=solutions[0].challenge,
                is_read=False,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded database:\n"
            f"- {User.objects.count()} users\n"
            f"- {Category.objects.count()} categories\n"
            f"- {Tag.objects.count()} tags\n"
            f"- {Challenge.objects.count()} challenges\n"
            f"- {Solution.objects.count()} solutions\n"
            f"- {Comment.objects.count()} comments\n"
            f"- {Vote.objects.count()} votes\n"
            f"- {Notification.objects.count()} notifications"
        ))
