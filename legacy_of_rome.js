/*
 * Legacy of Rome v1.0.0
 * Additive content mod for NeverEnding Legacy (engine version 1).
 * Load after data.js. All globally registered names use the rome_ prefix.
 */

G.AddData({
	name:'Legacy of Rome',
	author:'Ryan Johnston',
	desc:'Adds a Roman-inspired progression path with civic infrastructure, law, roads, aqueducts, legions, taxation, citizenship, and imperial administration.',
	engineVersion:1,
	manifest:0,
	requires:['Default dataset*'],
	func:function()
	{
		/* Balance constants are collected here so later tuning is painless. */
		var ROME={
			forumCost:250,
			aqueductConcreteCost:200,
			provinceConcreteCost:250,
			legionaryDenariiCost:50,
			provinceDenariiCost:200
		};

		/* ------------------------------------------------------------------
		 * RESOURCES (7)
		 * ------------------------------------------------------------------ */
		new G.Res({
			name:'rome_grain',
			displayName:'Grain',
			desc:'[rome_grain,Grain] is a durable staple grown on organized estates. It supports cities and may be distributed through the grain dole.',
			icon:[7,7],
			turnToByContext:{'eating':{'health':0.015,'happiness':0.01},'decay':{'rome_grain':0.5,'spoiled food':0.5}},
			partOf:'food',
			category:'food'
		});
		new G.Res({
			name:'rome_denarii',
			displayName:'Denarii',
			desc:'[rome_denarii,Denarii] represent taxes and state revenue reserved for Roman civic and military expenses.',
			icon:[13,1],
			category:'misc'
		});
		new G.Res({
			name:'rome_concrete',
			displayName:'Roman Concrete',
			desc:'[rome_concrete,Roman Concrete] is a hydraulic building material mixed in [kiln]s from [brick]s, [cut stone], and [water].',
			icon:[3,8],
			category:'build'
		});
		new G.Res({
			name:'rome_civic_order',
			displayName:'Civic Order',
			desc:'[rome_civic_order,Civic Order] measures the administrative capacity and public stability that hold Roman institutions together.',
			icon:[24,6],
			fractional:true,
			category:'misc',
			// Soft limiter: accumulated order slowly dissipates unless institutions keep producing it.
			tick:function(me,tick)
			{
				if (tick%20==0 && me.amount>0) me.amount*=0.9975;
			}
		});
		new G.Res({
			name:'rome_legionary_equipment',
			displayName:'Legionary Equipment',
			desc:'[rome_legionary_equipment,Legionary Equipment] combines standardized iron arms, armor, and field kit for one professional soldier.',
			icon:[2,9],
			category:'gear'
		});
		new G.Res({
			name:'rome_provincial_tribute',
			displayName:'Provincial Tribute',
			desc:'[rome_provincial_tribute,Provincial Tribute] records goods and obligations collected from governed territories.',
			icon:[14,8],
			fractional:true,
			category:'misc'
		});
		new G.Res({
			name:'rome_road_network',
			displayName:'Road Network',
			desc:'The [rome_road_network,Road Network] represents maintained paved routes connecting settlements, armies, and tax districts.',
			icon:[30,7],
			fractional:true,
			category:'build'
		});

		/* Additive production modes on existing vanilla workshops. */
		G.getDict('kiln').modes['rome_concrete']={
			name:'Mix Roman concrete',
			icon:[3,8],
			desc:'Turn 2 [brick]s, 1 [cut stone], and 2 [water] into 3 [rome_concrete,Roman Concrete].',
			req:{'rome_roman_concrete':true},
			use:{'worker':1,'stone tools':1}
		};
		G.getDict('kiln').effects.push({
			type:'convert',
			from:{'brick':2,'cut stone':1,'water':2},
			into:{'rome_concrete':3},
			every:3,
			mode:'rome_concrete'
		});
		G.getDict('blacksmith workshop').modes['rome_legionary_equipment']={
			name:'Forge legionary equipment',
			icon:[2,9],
			desc:'Turn 2 [hard metal ingot]s and 1 [leather] into 1 set of [rome_legionary_equipment,Legionary Equipment].',
			req:{'rome_legionary_reforms':true},
			use:{'worker':1,'metal tools':1}
		};
		G.getDict('blacksmith workshop').effects.push({
			type:'convert',
			from:{'hard metal ingot':2,'leather':1},
			into:{'rome_legionary_equipment':1},
			every:3,
			mode:'rome_legionary_equipment'
		});

		/* ------------------------------------------------------------------
		 * UNITS AND BUILDINGS (8)
		 * ------------------------------------------------------------------ */
		new G.Unit({
			name:'rome_grain_estate',
			displayName:'Grain Estate',
			desc:'@produces [rome_grain,Grain] from organized fields<>A [rome_grain_estate,Grain Estate] brings land, labour, and storage under regular administration.',
			icon:[7,7],
			cost:{'basic building materials':100},
			use:{'land':4,'worker':2},
			upkeep:{'coin':0.2},
			effects:[
				{type:'gather',what:{'rome_grain':8}},
				{type:'gather',what:{'rome_grain':2},req:{'rome_public_works':'grand'}}
			],
			req:{'rome_latin_law':true,'plant lore':true,'building':true},
			category:'production'
		});
		new G.Unit({
			name:'rome_magistrate',
			displayName:'Magistrate',
			desc:'@generates [rome_civic_order,Civic Order] and [influence]<>A [rome_magistrate,Magistrate] applies written law and settles disputes in the name of the state.',
			icon:[22,6],
			cost:{'rome_denarii':25},
			use:{'worker':1},
			upkeep:{'rome_denarii':0.25},
			effects:[
				{type:'gather',what:{'rome_civic_order':0.10,'influence':0.03}},
				{type:'gather',what:{'authority':0.02,'happiness':-0.02},req:{'rome_citizenship_policy':'restricted'}},
				{type:'convert',from:{'rome_denarii':0.20},into:{'rome_civic_order':0.12,'culture':0.06},every:2,req:{'rome_citizenship_policy':'expanding'}},
				{type:'convert',from:{'rome_denarii':0.50},into:{'rome_civic_order':0.25,'culture':0.12,'happiness':0.06},every:2,req:{'rome_citizenship_policy':'universal'}}
			],
			limitPer:{'population':100},
			req:{'rome_latin_law':true},
			category:'political',
			priority:5
		});
		new G.Unit({
			name:'rome_tax_collector',
			displayName:'Tax Collector',
			desc:'@collects [rome_denarii,Denarii]@tax policy changes revenue and public reaction<>A [rome_tax_collector,Tax Collector] turns assessed obligations into usable state revenue.',
			icon:[13,1,22,6],
			cost:{'basic building materials':25},
			use:{'worker':1},
			upkeep:{'coin':0.2},
			effects:[
				{type:'gather',what:{'rome_denarii':0.45}},
				{type:'gather',what:{'happiness':0.05,'rome_civic_order':0.02},req:{'rome_taxation_policy':'low'}},
				{type:'gather',what:{'rome_denarii':0.20},req:{'rome_taxation_policy':'standard'}},
				{type:'gather',what:{'rome_denarii':0.45,'happiness':-0.08,'rome_civic_order':-0.04},req:{'rome_taxation_policy':'heavy'}}
			],
			limitPer:{'population':75},
			req:{'rome_latin_law':true},
			category:'political'
		});
		new G.Unit({
			name:'rome_forum',
			displayName:'Forum',
			desc:'@generates [rome_civic_order,Civic Order], [culture], and [influence]@administers the grain dole<>The [rome_forum,Forum] is the civic heart of a Roman settlement.',
			icon:[23,8],
			cost:{'basic building materials':ROME.forumCost,'rome_denarii':50},
			use:{'land':3},
			upkeep:{'rome_denarii':0.2},
			effects:[
				{type:'gather',what:{'rome_civic_order':0.35,'culture':0.10,'influence':0.03}},
				{type:'gather',what:{'culture':0.05},req:{'rome_civic_architecture':true}},
				{type:'convert',from:{'rome_grain':1},into:{'happiness':0.25,'rome_civic_order':0.03},every:5,req:{'rome_grain_dole':'modest'}},
				{type:'convert',from:{'rome_grain':2,'rome_denarii':0.25},into:{'happiness':0.70,'rome_civic_order':0.05},every:5,req:{'rome_grain_dole':'lavish'}}
			],
			limitPer:{'population':250},
			req:{'rome_republican_institutions':true},
			category:'civil'
		});
		new G.Unit({
			name:'rome_road_builder',
			displayName:'Road Builder',
			desc:'@turns building materials into [rome_road_network,Road Network]<>A [rome_road_builder,Road Builder] surveys, grades, drains, and paves durable routes.',
			icon:[30,7,7,2],
			cost:{'rome_denarii':10},
			use:{'worker':1},
			staff:{'stone tools':1},
			upkeep:{'rome_denarii':0.15},
			effects:[
				{type:'convert',from:{'basic building materials':6},into:{'rome_road_network':1},every:5},
				{type:'convert',from:{'basic building materials':5,'rome_denarii':0.10},into:{'rome_road_network':0.50},every:5,req:{'rome_public_works':'roads'}},
				{type:'convert',from:{'basic building materials':6,'rome_denarii':0.50},into:{'rome_road_network':1.20},every:5,req:{'rome_public_works':'grand'}}
			],
			req:{'rome_roman_roads':true},
			category:'production'
		});
		new G.Unit({
			name:'rome_legionary',
			displayName:'Legionary',
			desc:'@requires [rome_legionary_equipment,Legionary Equipment]@generates [rome_civic_order,Civic Order] at substantial upkeep<>A [rome_legionary,Legionary] is a drilled professional soldier and a costly instrument of state power.',
			icon:[27,5,5,9],
			cost:{'rome_denarii':ROME.legionaryDenariiCost},
			use:{'worker':1},
			staff:{'rome_legionary_equipment':1},
			upkeep:{'rome_denarii':0.5,'food':0.2},
			effects:[
				{type:'gather',what:{'rome_civic_order':0.08}},
				{type:'gather',what:{'rome_civic_order':0.05,'happiness':-0.02},req:{'rome_conscription':'limited'}},
				{type:'gather',what:{'rome_civic_order':0.12,'authority':0.01,'happiness':-0.08},req:{'rome_conscription':'mass'}}
			],
			limitPer:{'population':25},
			req:{'rome_legionary_reforms':true},
			category:'political',
			priority:4
		});
		new G.Unit({
			name:'rome_aqueduct',
			displayName:'Aqueduct',
			desc:'@supplies [water] and improves [health] and [happiness]<>A [rome_aqueduct,Aqueduct] carries clean water across long distances on carefully graded channels.',
			icon:[25,3,30,7],
			cost:{'rome_concrete':ROME.aqueductConcreteCost,'basic building materials':100,'rome_denarii':50},
			use:{'land':3},
			upkeep:{'rome_denarii':0.3},
			effects:[
				{type:'gather',what:{'water':25,'health':0.60,'happiness':0.20,'rome_civic_order':0.05}},
				{type:'gather',what:{'health':0.25,'happiness':0.10},req:{'rome_civic_architecture':true}}
			],
			limitPer:{'population':250},
			req:{'rome_aqueduct_engineering':true},
			category:'civil'
		});
		new G.Unit({
			name:'rome_province',
			displayName:'Province',
			desc:'@produces [rome_provincial_tribute,Provincial Tribute], [rome_denarii,Denarii], and [rome_grain,Grain]@requires [rome_civic_order,Civic Order] upkeep<>A [rome_province,Province] abstracts the governors, districts, and obligations of distant territory.',
			icon:[29,7,24,6],
			cost:{'rome_concrete':ROME.provinceConcreteCost,'rome_denarii':ROME.provinceDenariiCost,'rome_road_network':100},
			use:{'land':10},
			upkeep:{'rome_civic_order':1,'rome_denarii':1},
			effects:[
				{type:'gather',what:{'rome_provincial_tribute':0.50,'rome_denarii':0.60,'rome_grain':2}}
			],
			limitPer:{'population':1000},
			req:{'rome_provincial_administration':true},
			category:'political'
		});

		/* ------------------------------------------------------------------
		 * TECHNOLOGIES (9)
		 * ------------------------------------------------------------------ */
		new G.Tech({
			name:'rome_latin_law',displayName:'Latin Law',icon:[24,6],
			desc:'@reveals [rome_denarii,Denarii] and [rome_civic_order,Civic Order]@unlocks [rome_magistrate,Magistrates], [rome_tax_collector,Tax Collectors], and [rome_grain_estate,Grain Estates]<>Written statutes turn custom into a repeatable civic system.',
			cost:{'insight':25,'culture':10},req:{'code of law':true,'language':true},
			effects:[{type:'show res',what:['rome_denarii','rome_civic_order','rome_grain']}]
		});
		new G.Tech({
			name:'rome_republican_institutions',displayName:'Republican Institutions',icon:[23,8],
			desc:'@unlocks [rome_forum,Forums]@allows citizenship and grain-dole policies<>Magistracies and public deliberation distribute civic authority across durable offices.',
			cost:{'insight':35,'culture':15},req:{'rome_latin_law':true,'cities':true},effects:[]
		});
		new G.Tech({
			name:'rome_roman_roads',displayName:'Roman Roads',icon:[30,7],
			desc:'@reveals the [rome_road_network,Road Network]@unlocks [rome_road_builder,Road Builders]<>Layered, drained roads let officials, trade, and armies move reliably.',
			cost:{'insight':40,'culture':10},req:{'construction':true,'rome_latin_law':true},
			effects:[{type:'show res',what:['rome_road_network']}]
		});
		new G.Tech({
			name:'rome_legionary_reforms',displayName:'Legionary Reforms',icon:[27,5],
			desc:'@unlocks legionary equipment forging at [blacksmith workshop]s@unlocks [rome_legionary,Legionaries]<>Standard training and equipment create an expensive professional force.',
			cost:{'insight':45,'culture':10},req:{'iron-working':true,'code of law':true},
			effects:[{type:'show res',what:['rome_legionary_equipment']}]
		});
		new G.Tech({
			name:'rome_roman_concrete',displayName:'Roman Concrete',icon:[3,8],
			desc:'@unlocks Roman concrete mixing at [kiln]s<>A water-setting mortar makes larger and more durable civic works possible.',
			cost:{'insight':45},req:{'masonry':true,'construction':true},
			effects:[{type:'show res',what:['rome_concrete']}]
		});
		new G.Tech({
			name:'rome_aqueduct_engineering',displayName:'Aqueduct Engineering',icon:[25,3],
			desc:'@unlocks [rome_aqueduct,Aqueducts]<>Surveying and hydraulic construction carry clean water into dense settlements.',
			cost:{'insight':50,'culture':15},req:{'rome_roman_concrete':true,'city planning':true},effects:[]
		});
		new G.Tech({
			name:'rome_civic_architecture',displayName:'Civic Architecture',icon:[29,6],
			desc:'@improves [rome_forum,Forums] and [rome_aqueduct,Aqueducts]@allows Bread and Circuses to emerge<>Public buildings become deliberate instruments of health, culture, and legitimacy.',
			cost:{'insight':55,'culture':25},req:{'rome_roman_concrete':true,'rome_republican_institutions':true},effects:[]
		});
		new G.Tech({
			name:'rome_provincial_administration',displayName:'Provincial Administration',icon:[29,7],
			desc:'@reveals [rome_provincial_tribute,Provincial Tribute]@unlocks [rome_province,Provinces]<>Governors, censuses, roads, and tax districts project administration beyond the capital.',
			cost:{'insight':60,'culture':25},req:{'rome_roman_roads':true,'rome_republican_institutions':true},
			effects:[{type:'show res',what:['rome_provincial_tribute']}]
		});
		new G.Tech({
			name:'rome_pax_romana',displayName:'Pax Romana',icon:[24,8],
			desc:'@allows the Pax Romana trait to emerge<>Roads, law, provincial government, and disciplined force create an enduring—if costly—peace.',
			cost:{'insight':90,'culture':50},req:{'rome_provincial_administration':true,'rome_roman_roads':true,'rome_legionary_reforms':true},effects:[]
		});

		/* ------------------------------------------------------------------
		 * TRAITS (4)
		 * Trait functions permanently append effects when the trait is gained.
		 * This mirrors the official example mod's one-time trait mutation.
		 * ------------------------------------------------------------------ */
		new G.Trait({
			name:'rome_roman_citizenship',displayName:'Roman Citizenship',icon:[24,6,2,1],
			desc:'@[rome_forum,Forums] and [rome_magistrate,Magistrates] generate more [culture] and [rome_civic_order,Civic Order]',
			cost:{'culture':20},chance:5,req:{'rome_latin_law':true,'rome_republican_institutions':true},
			effects:[{type:'function',func:function(){
				G.getDict('rome_forum').effects.push({type:'gather',what:{'rome_civic_order':0.08,'culture':0.04}});
				G.getDict('rome_magistrate').effects.push({type:'gather',what:{'rome_civic_order':0.04,'culture':0.02}});
			}}]
		});
		new G.Trait({
			name:'rome_bread_and_circuses',displayName:'Bread and Circuses',icon:[7,7,23,8],
			desc:'@an active grain dole generates additional [happiness] from every [rome_forum,Forum]',
			cost:{'culture':25,'rome_grain':50},chance:8,req:{'rome_civic_architecture':true,'rome_grain':true},
			effects:[{type:'function',func:function(){
				G.getDict('rome_forum').effects.push({type:'gather',what:{'happiness':0.10},req:{'rome_grain_dole':'modest'}});
				G.getDict('rome_forum').effects.push({type:'gather',what:{'happiness':0.25},req:{'rome_grain_dole':'lavish'}});
			}}]
		});
		new G.Trait({
			name:'rome_imperial_bureaucracy',displayName:'Imperial Bureaucracy',icon:[29,7,13,1],
			desc:'@[rome_province,Provinces] generate more [rome_provincial_tribute,Provincial Tribute] and [rome_denarii,Denarii]',
			cost:{'culture':30,'rome_denarii':100},chance:10,req:{'rome_provincial_administration':true},
			effects:[{type:'function',func:function(){
				G.getDict('rome_province').effects.push({type:'gather',what:{'rome_provincial_tribute':0.20,'rome_denarii':0.20}});
			}}]
		});
		new G.Trait({
			name:'rome_pax_romana_trait',displayName:'Pax Romana',icon:[24,8,30,7],
			desc:'@[rome_grain_estate,Grain Estates], [rome_forum,Forums], [rome_road_builder,Road Builders], and [rome_province,Provinces] are 10% more efficient',
			cost:{'culture':50,'rome_civic_order':100},chance:5,req:{'rome_pax_romana':true},
			effects:[{type:'function',func:function(){
				var units=['rome_grain_estate','rome_forum','rome_road_builder','rome_province'];
				for (var i in units) G.getDict(units[i]).effects.push({type:'mult',value:1.10});
			}}]
		});

		/* ------------------------------------------------------------------
		 * POLICIES (5)
		 * Policy modes are consumed by conditional unit effects above.
		 * ------------------------------------------------------------------ */
		G.policyCategories.push({id:'rome',name:'Roman Administration'});
		new G.Policy({
			name:'rome_taxation_policy',displayName:'Taxation Policy',icon:[13,1,24,6],
			desc:'Set the tax burden. Low taxes improve morale; heavy taxes raise revenue while eroding happiness and civic order.',
			cost:{'influence':2},startMode:'standard',req:{'rome_latin_law':true},
			modes:{
				'low':{name:'Low Taxes',desc:'Less revenue; more happiness and Civic Order.'},
				'standard':{name:'Standard Taxes',desc:'Balanced Roman taxation.'},
				'heavy':{name:'Heavy Taxes',desc:'More revenue; less happiness and Civic Order.'}
			},category:'rome'
		});
		new G.Policy({
			name:'rome_grain_dole',displayName:'Grain Dole',icon:[7,7,5,12],
			desc:'Distribute grain through Forums to support urban happiness and stability.',
			cost:{'influence':2},startMode:'off',req:{'rome_republican_institutions':true},
			modes:{
				'off':G.MODE_OFF,
				'modest':{name:'Modest Dole',desc:'Forums consume a little Grain for happiness.'},
				'lavish':{name:'Lavish Dole',desc:'Forums consume more Grain and Denarii for greater happiness.'}
			},category:'rome'
		});
		new G.Policy({
			name:'rome_conscription',displayName:'Conscription',icon:[27,5,7,12],
			desc:'Broaden military service to extract more order from Legionaries at a cost to happiness.',
			cost:{'influence':3},startMode:'off',req:{'rome_legionary_reforms':true},
			modes:{
				'off':G.MODE_OFF,
				'limited':{name:'Limited Conscription',desc:'A small Civic Order bonus with a small happiness penalty.'},
				'mass':{name:'Mass Conscription',desc:'A larger Civic Order bonus with a severe happiness penalty.'}
			},category:'rome'
		});
		new G.Policy({
			name:'rome_citizenship_policy',displayName:'Citizenship Policy',icon:[24,6,3,3],
			desc:'Define access to citizenship. Wider citizenship costs Denarii but improves culture, happiness, and civic order.',
			cost:{'influence':3},startMode:'restricted',req:{'rome_republican_institutions':true},
			modes:{
				'restricted':{name:'Restricted Citizenship',desc:'Cheap and authoritative, but less pleasant.'},
				'expanding':{name:'Expanding Citizenship',desc:'Magistrates spend Denarii for Culture and Civic Order.'},
				'universal':{name:'Universal Citizenship',desc:'High Denarii upkeep for strong stability and culture.'}
			},category:'rome'
		});
		new G.Policy({
			name:'rome_public_works',displayName:'Public Works',icon:[30,7,8,12],
			desc:'Choose the intensity of state-sponsored infrastructure. Larger programs consume more materials and Denarii.',
			cost:{'influence':3},startMode:'minimal',req:{'rome_roman_roads':true},
			modes:{
				'minimal':{name:'Minimal Works',desc:'Road Builders operate at their basic rate.'},
				'roads':{name:'Road Building',desc:'Road Builders consume extra materials and Denarii for more roads.'},
				'grand':{name:'Grand Projects',desc:'Maximum road and estate output at substantial expense.'}
			},category:'rome'
		});
	}
});
