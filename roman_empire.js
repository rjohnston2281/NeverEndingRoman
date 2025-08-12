/*
 * Roman Empire Mod for NeverEnding Legacy
 *
 * This mod adds a late‑game technology and unit inspired by the Roman Empire. Once
 * your tribe has mastered advanced building techniques and metallurgy, you can
 * research the "Roman Empire" tech. This unlocks Legionaries – disciplined
 * soldiers who gather insight through rigorous training and provide a small
 * multiplier to overall efficiency when your laws turn toward imperial ideals.
 *
 * Author: NeverEnding Legacy community mod example (adapted by ChatGPT)
 *
 * To install this mod, create a new game in NeverEnding Legacy, click the
 * "Use mods" button on the main menu, and add the URL of this file and its
 * companion manifest (roman_empire_manifest.js) below the default data line.
 */

G.AddData({
    name: 'Roman Empire',
    author: 'Community Modder',
    desc: 'Adds the Roman Empire era: a new tech and Legionary unit unlocked late in the tech tree.',
    engineVersion: 1,
    // Point to our manifest so the game knows where to find this dataset.
    manifest: 'roman_empire_manifest.js',
    // Our mod depends on the base game data; always include the default dataset.
    requires: ['Default dataset*'],
    // We are not shipping any custom sprite sheets; default icons will be used.
    sheets: {},
    func: function () {
        /*
         * Define the Roman Empire tech. Requiring construction, iron working and
         * philosophy ensures this becomes available well into the tech tree. The
         * cost is set higher than most early technologies to reflect its late
         * appearance. No direct effects are added here – the tech simply acts
         * as a gate for our Legionary unit and potential future Roman bonuses.
         */
        new G.Tech({
            name: 'roman empire',
            desc: '@[leaders] can unify your people under a Roman‑style state, unlocking Legionaries.<>' +
                'Adopting the Roman model requires advanced construction, metallurgy and philosophical thought.',
            icon: [0, 0],
            cost: { 'insight': 50, 'influence': 10 },
            req: { 'construction': true, 'iron working': true, 'philosophy': true },
            effects: [],
            chance: 3,
        });

        /*
         * Define the Legionary unit. This is an improved soldier that represents
         * the disciplined fighting force of Rome. It gathers insight to represent
         * tactical knowledge gained from drilling and battle. When combined
         * with imperial laws (implemented as a policy toggle in the base game),
         * Legionaries provide a mild multiplier to efficiency, reflecting Roman
         * organization. The unit is expensive to train and requires the Roman
         * Empire tech.
         */
        new G.Unit({
		  name: 'legionary',
		  desc: 'A disciplined Roman soldier who trains relentlessly.<>Each Legionary gathers insight through drill and battle, and their presence bolsters your tribe when imperial laws are in effect.',
		  icon: [0, 0],
		  cost: { 'food': 100, 'iron': 20 },
		  use: { 'worker': 1 },
		  effects: [
			{ type: 'gather', what: { 'insight': 0.4 } },
			{ type: 'gather', what: { 'influence': 0.2 }, req: { 'roman empire': true } },
			{ type: 'mult', value: 1.1, req: { 'roman laws': 'on' } },
		  ],
		  category: 'military',
		  req: { 'roman empire': true },
		  limitPer: { 'house': 1 },
		});
    },
});