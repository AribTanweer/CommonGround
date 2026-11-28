import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from apps.challenges.models import Category, Tag, Challenge, ChallengeUpdate, Follow
from apps.solutions.models import Solution, SolutionRevision
from apps.engagement.models import Comment, Vote, Report
from apps.notifications.models import Notification

User = get_user_model()
DEMO_USERNAMES = (
    "arjun_sharma", "priya_patel", "rahul_verma", "ananya_deshmukh",
    "vikram_singh", "fatima_khan", "meera_iyer", "sana_rahman",
    "joseph_dsouza", "kavya_nair", "imran_sheikh", "tsering_dolma",
)


class Command(BaseCommand):
    help = "Refresh the named demo accounts and their content with a diverse, deterministic sample dataset."

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(2026)
        self.stdout.write("Refreshing CommonGround demo content...")
        demo_user_ids = list(
            User.objects.filter(username__in=DEMO_USERNAMES).values_list("pk", flat=True)
        )
        if demo_user_ids:
            Notification.objects.filter(
                Q(recipient_id__in=demo_user_ids) | Q(actor_id__in=demo_user_ids)
            ).delete()
            Report.objects.filter(reporter_id__in=demo_user_ids).delete()
            ChallengeUpdate.objects.filter(author_id__in=demo_user_ids).delete()
            Comment.objects.filter(author_id__in=demo_user_ids).delete()
            SolutionRevision.objects.filter(editor_id__in=demo_user_ids).delete()
            Vote.objects.filter(user_id__in=demo_user_ids).delete()
            Follow.objects.filter(user_id__in=demo_user_ids).delete()
            Solution.objects.filter(author_id__in=demo_user_ids).delete()
            Challenge.objects.filter(author_id__in=demo_user_ids).delete()

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
            {
                "username": "fatima_khan",
                "email": "fatima@example.com",
                "bio": "Public health nurse working with residents on safer streets and cleaner air.",
                "location": "Hyderabad, India",
                "reputation": 84,
                "email_notifications_enabled": True,
            },
            {
                "username": "meera_iyer",
                "email": "meera@example.com",
                "bio": "Transit researcher who listens to daily commuters and shift workers.",
                "location": "Chennai, India",
                "reputation": 112,
                "email_notifications_enabled": False,
            },
            {
                "username": "sana_rahman",
                "email": "sana@example.com",
                "bio": "Disability rights volunteer and accessibility auditor.",
                "location": "Kolkata, India",
                "reputation": 176,
                "email_notifications_enabled": True,
            },
            {
                "username": "joseph_dsouza",
                "email": "joseph@example.com",
                "bio": "Coastal resident documenting flooding, waste, and public-space access.",
                "location": "Kochi, India",
                "reputation": 71,
                "email_notifications_enabled": False,
            },
            {
                "username": "kavya_nair",
                "email": "kavya@example.com",
                "bio": "Teacher interested in safe routes, libraries, and after-school learning.",
                "location": "Thiruvananthapuram, India",
                "reputation": 102,
                "email_notifications_enabled": True,
            },
            {
                "username": "imran_sheikh",
                "email": "imran@example.com",
                "bio": "Small-business owner and market association volunteer in Indore.",
                "location": "Indore, India",
                "reputation": 58,
                "email_notifications_enabled": True,
            },
            {
                "username": "tsering_dolma",
                "email": "tsering@example.com",
                "bio": "Community organizer focused on heat resilience and access to public services.",
                "location": "Leh, India",
                "reputation": 93,
                "email_notifications_enabled": False,
            },
        ]

        users = []
        for udata in users_data:
            user, _ = User.objects.get_or_create(username=udata["username"])
            user.email = udata["email"]
            user.bio = udata["bio"]
            user.location = udata["location"]
            user.reputation = udata["reputation"]
            user.is_email_verified = False
            user.email_notifications_enabled = udata.get("email_notifications_enabled", True)
            user.set_password("password123")
            user.save()
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
            ("Community Health & Wellbeing", "community-health-wellbeing", "heart-pulse"),
            ("Digital Access & Inclusion", "digital-access-inclusion", "wifi"),
            ("Climate Resilience", "climate-resilience", "cloud-sun"),
        ]
        categories = [
            Category.objects.update_or_create(
                slug=slug, defaults={"name": name, "icon": icon}
            )[0]
            for name, slug, icon in categories_data
        ]

        self.stdout.write("Creating tags...")
        tag_names = [
            "lighting", "traffic", "cleanliness", "parks", "solar",
            "roads", "waste-management", "water-supply", "pedestrian", "air-quality",
            "accessibility", "public-transit", "safe-routes", "heat", "digital-access",
            "public-health", "coastal-resilience", "youth", "accountability",
        ]
        tags = [
            Tag.objects.update_or_create(slug=name, defaults={"name": name})[0]
            for name in tag_names
        ]

        self.stdout.write("Creating challenges...")
        challenge_samples = [
            ("Broken streetlights on Indiranagar 12th Main",
             "Four lamps between the bus stop and the 12th Main market have been out for three weeks. Shopkeepers and evening commuters say the unlit crossing is difficult to use after 8 pm; the ward complaint number is CG-2417.",
             0, [0, 2], "Indiranagar 12th Main, Bengaluru", "proposed"),
            ("Severe waterlogging near Central Market underpass",
             "After two heavy showers this month, water remained across the underpass until late morning. Pedestrians are walking in the carriageway and two bus routes are detouring; residents have photos from 7:30 am after each storm.",
             0, [1, 5, 8], "Nana Peth market underpass, Pune", "in_progress"),
            ("Overflowing garbage bins outside Community Park",
             "The two public bins outside the market garden were missed on three collection days this week. Food waste is spilling onto the footpath, making the park entrance hard to use for people with strollers and mobility aids.",
             3, [2, 6], "Andheri East market garden, Mumbai", "proposed"),
            ("Unregulated speeding near St. Jude Public School",
             "Families report cars and motorbikes cutting through the school lane during the 8 am arrival period. The crossing paint has faded and parked vehicles block the sightline; the school has offered to help count traffic for a week.",
             2, [1, 8], "Adarsh Nagar School Road, Jaipur", "resolved"),
            ("Neglected public park with broken benches and dead trees",
             "The north path has three broken paving sections and two benches with loose slats. Residents have asked for a maintenance inspection and a public schedule for pruning and bin collection before the monsoon.",
             1, [3, 2], "Sector 12 neighborhood park, Dwarka, Delhi", "proposed"),
            ("Frequent drinking water contamination in Block C",
             "Several households have noticed brown water at the first morning supply on four days this month. Residents have kept dated photos and are asking for a sample test and a clear update from the water utility before drawing conclusions about the cause.",
             5, [7], "Whitefield, Bengaluru, Block C supply line", "proposed"),
            ("Lack of designated cycling tracks on Ring Road",
             "The service lane narrows beside a bus stop and delivery vehicles often park across it. Two local cycling groups have logged close passes during the 8 to 10 am commute and can share the route notes with the road agency.",
             0, [1, 8], "Outer Ring Road service lane, Hyderabad", "proposed"),
            ("Absence of public restrooms near bustling bus terminal",
             "The accessible toilet at the terminal has been locked during three recent evening visits. The next open facility is outside the station area, which is difficult for older passengers and people travelling with children.",
             3, [2], "Koyambedu bus terminal, Chennai", "in_progress"),
            ("Dust pollution from uncovered construction materials",
             "Two active building sites have left sand piles beside the public footpath uncovered on dry, windy afternoons. Residents have asked the site managers to cover materials and keep pedestrian access clear while the ward team checks the complaint.",
             1, [9, 2], "Sector 57 construction corridor, Gurugram", "proposed"),
            ("Stray cattle blocking arterial highway intersection",
             "Residents have seen cattle resting on the traffic island near the junction on several evenings. Drivers brake suddenly and the animals are exposed to fast traffic; the community is asking the municipality and local animal-care groups to coordinate a humane response.",
             0, [1], "Ajmer Road and Ring Road junction, Jaipur", "proposed"),
            ("Damaged footbridge over Railway Line connecting Sector 8 & 9",
             "Two deck plates move underfoot on the east stair landing and the handrail is loose at one joint. Commuters have reported the hazard to the rail help desk and want a temporary barrier until an inspection is completed.",
             0, [8], "Sealdah rail approach, Kolkata", "in_progress"),
            ("Need for safer lighting in a newly serviced resettlement neighborhood",
             "Several lanes in the recently expanded neighborhood have no working streetlights. Residents have asked the ward office to assess pole locations before the next monsoon.",
             2, [0, 4], "Navjeevan Nagar, Ward 11, Jaipur", "proposed"),
            ("No accessible ramps for wheelchairs at District Library",
             "The step-free entrance is currently used for deliveries and is locked during public hours. Library users who use wheelchairs or have limited mobility have requested a reliable accessible entrance and clear signage.",
             4, [8], "District Library, Deccan, Pune", "resolved"),
            ("Illegal dumping of electronic waste along canal bank",
             "Residents found discarded batteries and circuit boards beside the canal path. The material has not been tested, so the request is for safe removal by an authorized e-waste collector and a collection point for future household drop-offs.",
             1, [6, 7], "Sabarmati service road, Ahmedabad", "proposed"),
            ("Pothole cluster at Main Market intersection causing accidents",
             "Three open patches remain where a utility repair was completed last month. Drivers swerve around them during market hours, and shopkeepers have submitted a repair request with photos and the work-order date.",
             0, [5, 1], "Rajwada market crossing, Indore", "proposed"),
            ("Inadequate bus frequency during early morning shift hours",
             "Passengers on the first shift say the 5:40 and 6:10 am trips are often full or do not arrive. A worker group is collecting a two-week count so the transit operator can review demand before changing the schedule.",
             0, [1], "Dahisar industrial shift route, Mumbai", "proposed"),
            ("Open drainage trench without protective railings near playground",
             "A section of the storm drain beside the football ground is open where a cover slab broke. Children use the path after school, so residents have requested a temporary barrier first and a dated repair plan from the public works team.",
             3, [2, 7], "Municipal football ground, Bhopal", "in_progress"),
            ("Lack of after-school learning center for underprivileged children",
             "The community hall is available only during daytime hours, leaving students without a nearby quiet place to study after school. Teachers and parents are exploring a supervised evening room with donated books and scheduled device access.",
             4, [], "Bapu Nagar community hall, Indore", "proposed"),
            ("Dying urban lake due to unchecked sewage inflow",
             "A green surface bloom has appeared near the inlet after several weeks of low rainfall. Residents are requesting water-quality testing and an inspection of nearby drains before identifying a source or proposing a permanent fix.",
             1, [7, 3], "Shahpura Lake inlet, Bhopal", "in_progress"),
            ("Excessive noise pollution from unregistered banquets near residential zones",
             "Neighbors on three lanes have logged amplified music after the posted quiet hours on four weekdays this month. They want a clear contact for time-stamped complaints and a fair process for venues and residents to resolve repeat issues.",
             2, [], "Residential lane near Sealdah, Kolkata", "proposed"),
            ("Heat-safe drinking water and shade missing from two city bus stops",
             "During April and May, passengers wait in direct sun for 20 to 30 minutes. The nearest drinking water point is inside a private shop, and older riders have reported dizziness.",
             8, [3, 4, 13], "Gandhi Road stops 14 and 15, Leh", "proposed"),
            ("Residents need an offline way to access ward services",
             "The ward grievance form requires a smartphone and a one-time password. Several older residents and people with limited data access cannot submit repair requests or track existing ones.",
             7, [10, 17], "Ward 22 community library, Indore", "proposed"),
            ("High-tide flooding blocks the only step-free route to the ferry",
             "Water covers the sloped approach during spring tides, leaving wheelchair users and parents with strollers unable to reach the Kochi ferry safely. The warning sign is faded and the drain backs up with plastic waste.",
             8, [10, 15, 2], "Fort Kochi ferry approach", "in_progress"),
            ("Community clinic queue has no private seating or clear language signs",
             "Patients wait outside in the sun and cannot tell which queue is for vaccinations, prenatal visits, or urgent care. The current signs are only in English and there is no private place to ask for help.",
             6, [14, 10], "Banjara Hills Urban Health Centre, Hyderabad", "resolved"),
            ("School crossing needs a safe route for children with mobility aids",
             "The zebra crossing near the school is often blocked by parked vehicles, and the curb ramp ends in a broken storm grate. Families currently use the road between moving traffic and parked scooters.",
             2, [1, 8, 10], "Government Middle School, Chennai", "closed"),
            ("Library computer room is inaccessible after the evening power cut",
             "Students who rely on the public library computers lose their study session during scheduled evening outages. The backup battery is undersized and there is no published outage schedule.",
             7, [16, 17, 7], "South Kolkata Community Library", "open"),
        ]

        challenges = []
        intended_statuses = []
        for i, (title, desc, cat_idx, tag_indices, loc, stat) in enumerate(challenge_samples):
            author = users[i % min(10, len(users))]
            cat = categories[cat_idx]
            ch = Challenge.objects.create(
                author=author,
                title=title,
                description=desc,
                category=cat,
                location=loc,
                status=stat,
                support_count=0,
            )
            if tag_indices:
                ch.tags.set([tags[ti] for ti in tag_indices if ti < len(tags)])
            challenges.append(ch)
            intended_statuses.append(stat)

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
            ("Add refillable water dispensers and tensile shade at both bus stops",
             "Install a metered refill station supplied by the municipal line, a shaded bench, and a heat index notice. Ask the bus operator to check the station during the morning route inspection.",
             "₹85,000 for both stops", "med"),
            ("Run a staffed heat-safety pilot before the summer peak",
             "Train nearby shopkeepers and transit staff to refill sealed water jars, identify heat illness, and call the local health helpline. Review usage and maintenance after four weeks.",
             "₹12,000 pilot", "low"),
            ("Set up a weekly assisted-service desk at the community library",
             "Offer a two-hour drop-in session with printed forms, a shared phone, and a receipt number for each grievance. Keep personal information out of public logs.",
             "₹3,500 per month", "low"),
            ("Publish a low-bandwidth grievance tracker with SMS receipts",
             "Add an SMS confirmation and a simple text-only status page to the existing ward service. Retain phone and paper submissions for residents who cannot use online forms.",
             "₹1,40,000 estimate", "high"),
            ("Clear and widen the ferry approach drain, then mark tide access hours",
             "Remove waste from the existing drain, install a removable non-slip ramp panel, and post tide-based access guidance in Malayalam and English. Review the ramp with local wheelchair users.",
             "₹68,000 estimate", "med"),
            ("Create a high-tide alert and accessible alternate route map",
             "Share a daily tide notice through the ferry desk and a printed board, with a step-free alternate route and a phone number for assistance.",
             "₹8,000 setup", "low"),
            ("Add shaded triage seating and bilingual queue signs at the clinic",
             "Work with clinic staff and patient volunteers to label queues in Telugu, Urdu, and English. Add shaded seating and a private desk for questions about sensitive care.",
             "₹42,000 estimate", "med"),
            ("Pilot a volunteer patient navigator for peak clinic hours",
             "Schedule a trained volunteer for two morning shifts each week to direct patients and collect anonymous feedback about confusing steps.",
             "Volunteer-led", "low"),
        ]

        self.stdout.write(f"Creating solutions ({len(solution_data)} total)...")
        solutions = []
        for i, (title, summ, cost, effort) in enumerate(solution_data):
            challenge = challenges[i // 2]
            author = users[(i + 1) % min(10, len(users))]
            if author == challenge.author:
                author = users[(i + 2) % min(10, len(users))]

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
                    editor=users[(i + 3) % min(10, len(users))],
                    content=summ + "\n\n*Updated with revised component specifications and estimated lead times.*",
                    note="Refined technical details based on civil engineer feedback.",
                )

        self.stdout.write("Creating follows...")
        for ch in challenges:
            for u in random.sample(users[:10], k=4):
                Follow.objects.get_or_create(user=u, challenge=ch)

        self.stdout.write("Creating comments...")
        comment_texts = [
            "This has been a massive issue during morning hours. Glad someone documented it with precise coordinates!",
            "I spoke with the junior engineer at the ward office yesterday; they claimed funds were sanctioned last month.",
            "Can we also look into whether solar alternatives would be cheaper in the long run?",
            "Fully endorse this solution. The proposed budget is very realistic and matches previous ward projects.",
            "Great initiative! Happy to volunteer for the survey and execution team on weekends.",
        ]

        for i, ch in enumerate(challenges):
            c1 = Comment.objects.create(
                author=users[(i + 1) % 10],
                challenge=ch,
                body=comment_texts[i % len(comment_texts)],
            )
            # Add reply
            Comment.objects.create(
                author=users[(i + 2) % 10],
                challenge=ch,
                parent=c1,
                body="Agreed! Let's present this collectively at the next Ward Committee meeting.",
            )

        for i, sol in enumerate(solutions[:15]):
            Comment.objects.create(
                author=users[(i + 2) % 10],
                solution=sol,
                body="The cost estimation here is very well thought out. Has the team verified warranty terms?",
            )

        self.stdout.write("Creating votes...")
        for ch in challenges:
            for u in users[:10]:
                if u != ch.author and random.random() > 0.3:
                    Vote.objects.get_or_create(user=u, challenge=ch, defaults={"value": 1})

        for sol in solutions:
            for u in users[:10]:
                if u != sol.author and random.random() > 0.4:
                    val = 1 if random.random() > 0.1 else -1
                    Vote.objects.get_or_create(user=u, solution=sol, defaults={"value": val})

        # Keep denormalized totals accurate and restore intended statuses after
        # the solution-created signal's automatic open -> proposed transition.
        for ch, intended_status in zip(challenges, intended_statuses):
            ch.support_count = Vote.objects.filter(challenge=ch, value=1).count()
            ch.status = intended_status
            ch.save(update_fields=["support_count", "status"])
            if intended_status != Challenge.Status.OPEN:
                status_label = dict(Challenge.Status.choices)[intended_status]
                evidence_url = (
                    f"https://example.com/commonground-demo/{ch.slug}/resolution"
                    if intended_status == Challenge.Status.RESOLVED
                    else ""
                )
                note = {
                    Challenge.Status.PROPOSED: "DEMO UPDATE: Residents are comparing proposals and collecting questions for the next ward meeting.",
                    Challenge.Status.IN_PROGRESS: "DEMO UPDATE: The owner reports that the responsible service team has been contacted and the next inspection date is being coordinated.",
                    Challenge.Status.RESOLVED: "DEMO UPDATE: Example resolution record for interface preview. Replace this illustrative evidence link with a verifiable source in live data.",
                    Challenge.Status.CLOSED: "DEMO UPDATE: Archived after the community review; no implementation claim is being made.",
                }.get(intended_status, f"DEMO UPDATE: Status recorded as {status_label}.")
                ChallengeUpdate.objects.create(
                    challenge=ch,
                    author=ch.author,
                    body=note,
                    status=intended_status,
                    evidence_url=evidence_url,
                )
        for sol in solutions:
            sol.score = sum(Vote.objects.filter(solution=sol).values_list("value", flat=True))
            sol.save(update_fields=["score"])

        self.stdout.write("Creating moderation reports...")
        challenge_comments = list(Comment.objects.filter(challenge__isnull=False).order_by("id"))
        solution_comments = list(Comment.objects.filter(solution__isnull=False).order_by("id"))
        report_samples = [
            ("challenge", challenges[2], "Location is too broad to verify; please add the park entrance or nearest landmark."),
            ("solution", solutions[8], "The proposal may rely on private sponsorship; disclose the maintenance terms."),
            ("comment", challenge_comments[3], "Contains a personal phone number that should be removed."),
            ("comment", solution_comments[1], "Possible duplicate comment; moderator review requested."),
        ]
        for i, (target_type, target, reason) in enumerate(report_samples):
            kwargs = {target_type: target}
            Report.objects.create(
                reporter=users[(i + 4) % 10],
                reason=reason,
                resolved=(i == 1),
                **kwargs,
            )

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

        # Ten active demo contributors have verified email; two unverified
        # profiles exercise the verification and account-settings UI states.
        User.objects.filter(pk__in=[u.pk for u in users[:10]]).update(is_email_verified=True)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded database:\n"
            f"- {User.objects.count()} users\n"
            f"- {Category.objects.count()} categories\n"
            f"- {Tag.objects.count()} tags\n"
            f"- {Challenge.objects.count()} challenges\n"
            f"- {ChallengeUpdate.objects.count()} progress updates\n"
            f"- {Solution.objects.count()} solutions\n"
            f"- {Comment.objects.count()} comments\n"
            f"- {Vote.objects.count()} votes\n"
            f"- {Notification.objects.count()} notifications"
            f"\n- {Report.objects.count()} moderation reports"
        ))
