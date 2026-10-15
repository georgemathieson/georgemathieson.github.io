/*
 * Lobster Pots: the MATHCOUNTS National Math Club dice game, played solo
 * against a seven day week.
 *
 * Each morning a forecast die is rolled, you split six pots between the
 * inshore shallows and the offshore deep, and a second die decides the
 * weather. The whole game turns on one number the forecast gives away:
 * a current arrives when the second roll comes in under the first, so a
 * forecast of F means a current with probability (F - 1) / 6.
 *
 * The canvas is decoration. Every piece of state is written into the
 * HTML around it as well, so the game is fully playable by someone who
 * never sees the picture.
 */
(function () {
    'use strict';

    var root = document.querySelector('[data-lobster-pots]');
    if (!root) {
        return;
    }

    // --- Rules -----------------------------------------------------------

    var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
        'Saturday', 'Sunday'];
    var POTS = 6;
    var STARTING_BALANCE = 50;
    var POT_COST = 10;          // what a pot lost to a current costs to replace
    var EARN_INSHORE_CALM = 2;
    var EARN_OFFSHORE_CALM = 6;
    var EARN_INSHORE_CURRENT = 4;
    var TAX_RATE = 0.08;        // Thursday, on profit only (rules allow 3-12%)
    var INTEREST_RATE = 0.1;    // Saturday, on a positive balance (5-30%)
    var LOTTERY_PRIZE = 100;    // Tuesday, for guessing the sum of two dice
    var STORAGE_KEY = 'lobster-pots.best';

    // --- State -----------------------------------------------------------

    var state;

    function freshState() {
        return {
            day: 0,
            balance: STARTING_BALANCE,
            offshore: 3,
            lotteryPick: 7,
            forecast: 1,
            actual: 1,
            current: false,
            phase: 'place',
            result: null,
            ledger: []
        };
    }

    function roll() {
        return 1 + Math.floor(Math.random() * 6);
    }

    function money(n) {
        return (n < 0 ? '-\u00a3' : '\u00a3') + Math.abs(n);
    }

    function dayName() {
        return DAYS[state.day];
    }

    // --- Elements --------------------------------------------------------

    var el = {
        day: root.querySelector('[data-lp-day]'),
        balance: root.querySelector('[data-lp-balance]'),
        canvas: root.querySelector('[data-lp-canvas]'),
        announce: root.querySelector('[data-lp-announce]'),
        place: root.querySelector('[data-lp-place]'),
        result: root.querySelector('[data-lp-result]'),
        done: root.querySelector('[data-lp-done]'),
        forecastDie: root.querySelector('[data-lp-die="forecast"]'),
        forecastText: root.querySelector('[data-lp-forecast-text]'),
        split: root.querySelector('[data-lp-split]'),
        radios: Array.prototype.slice.call(
            root.querySelectorAll('[data-lp-offshore]')),
        lottery: root.querySelector('[data-lp-lottery]'),
        lotteryPick: root.querySelector('[data-lp-lottery-pick]'),
        cast: root.querySelector('[data-lp-cast]'),
        actualDie: root.querySelector('[data-lp-die="actual"]'),
        resultHeading: root.querySelector('[data-lp-result-heading]'),
        resultLines: root.querySelector('[data-lp-result-lines]'),
        next: root.querySelector('[data-lp-next]'),
        ledgerBody: root.querySelector('[data-lp-ledger-body]'),
        finalLine: root.querySelector('[data-lp-final]'),
        verdict: root.querySelector('[data-lp-verdict]'),
        best: root.querySelector('[data-lp-best]'),
        restart: root.querySelector('[data-lp-restart]')
    };

    // --- Playing a day ---------------------------------------------------

    function startDay() {
        state.forecast = roll();
        state.phase = 'place';
        state.result = null;
        render();
    }

    function cast() {
        var offshore = state.offshore;
        var inshore = POTS - offshore;

        state.actual = roll();
        state.current = state.actual < state.forecast;

        var earned = state.current
            ? inshore * EARN_INSHORE_CURRENT
            : inshore * EARN_INSHORE_CALM + offshore * EARN_OFFSHORE_CALM;
        var lost = state.current ? offshore * POT_COST : 0;

        state.balance += earned - lost;

        var lines = [];
        if (state.current) {
            lines.push('A current ran. The ' + inshore + ' inshore '
                + plural(inshore, 'pot') + ' earned ' + money(inshore * EARN_INSHORE_CURRENT) + '.');
            if (offshore > 0) {
                lines.push('The ' + offshore + ' offshore ' + plural(offshore, 'pot')
                    + ' ' + (offshore === 1 ? 'was' : 'were') + ' destroyed. Replacing '
                    + (offshore === 1 ? 'it' : 'them') + ' cost ' + money(lost) + '.');
            } else {
                lines.push('Nothing was offshore, so nothing was lost.');
            }
        } else {
            lines.push('No current. Inshore earned '
                + money(inshore * EARN_INSHORE_CALM) + ', offshore earned '
                + money(offshore * EARN_OFFSHORE_CALM) + '.');
        }

        // Special days, applied after the catch is settled.
        var extraEarned = 0;
        var extraLost = 0;

        if (dayName() === 'Tuesday') {
            var a = roll();
            var b = roll();
            var sum = a + b;
            if (sum === state.lotteryPick) {
                extraEarned += LOTTERY_PRIZE;
                lines.push('Lottery: the dice came up ' + a + ' and ' + b + ', summing to '
                    + sum + '. You picked ' + state.lotteryPick + '. You win '
                    + money(LOTTERY_PRIZE) + '.');
            } else {
                lines.push('Lottery: the dice came up ' + a + ' and ' + b + ', summing to '
                    + sum + '. You picked ' + state.lotteryPick + '. No win.');
            }
        }

        if (dayName() === 'Thursday') {
            var profit = Math.max(0, state.balance + extraEarned - STARTING_BALANCE);
            var tax = Math.round(profit * TAX_RATE);
            extraLost += tax;
            lines.push(profit > 0
                ? 'Tax day: ' + Math.round(TAX_RATE * 100) + '% of ' + money(profit)
                    + ' profit is ' + money(tax) + '.'
                : 'Tax day: no profit yet, so no tax.');
        }

        if (dayName() === 'Saturday') {
            var balanceNow = state.balance + extraEarned - extraLost;
            if (balanceNow > 0) {
                var interest = Math.round(balanceNow * INTEREST_RATE);
                extraEarned += interest;
                lines.push('Interest day: ' + Math.round(INTEREST_RATE * 100) + '% on '
                    + money(balanceNow) + ' adds ' + money(interest) + '.');
            } else {
                lines.push('Interest day: the balance is not positive, so no interest.');
            }
        }

        state.balance += extraEarned - extraLost;

        state.ledger.push({
            day: dayName(),
            inshore: inshore,
            offshore: offshore,
            current: state.current,
            earned: earned + extraEarned,
            lost: lost + extraLost,
            balance: state.balance
        });

        state.result = {
            lines: lines,
            heading: state.current ? 'A current ran' : 'Calm water'
        };
        state.phase = 'result';
        render();

        announce(dayName() + ': forecast ' + state.forecast + ', actual '
            + state.actual + '. ' + (state.current ? 'A current ran.' : 'No current.')
            + ' Balance ' + money(state.balance) + '.');
    }

    function plural(n, word) {
        return n === 1 ? word : word + 's';
    }

    function nextDay() {
        if (state.day >= DAYS.length - 1) {
            state.phase = 'done';
            recordBest(state.balance);
            render();
            announce('The week is over. Final balance ' + money(state.balance) + '.');
            return;
        }
        state.day += 1;
        startDay();
    }

    function restart() {
        var offshore = state.offshore;
        state = freshState();
        state.offshore = offshore;
        startDay();
        announce('New week. Balance ' + money(state.balance) + '.');
    }

    function announce(text) {
        if (el.announce) {
            el.announce.textContent = text;
        }
    }

    // --- Best score ------------------------------------------------------

    function readBest() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw === null) {
                return null;
            }
            var value = parseInt(raw, 10);
            return isNaN(value) ? null : value;
        } catch (e) {
            return null;
        }
    }

    function recordBest(balance) {
        var best = readBest();
        if (best === null || balance > best) {
            try {
                window.localStorage.setItem(STORAGE_KEY, String(balance));
            } catch (e) {
                // Private browsing, blocked storage: the game still works.
            }
        }
    }

    // --- Rendering the HTML ----------------------------------------------

    function setDie(node, value) {
        if (!node) {
            return;
        }
        node.setAttribute('data-face', String(value));
        node.setAttribute('aria-label', node.getAttribute('data-die-label')
            + ': ' + value);
    }

    function render() {
        var offshore = state.offshore;
        var inshore = POTS - offshore;

        el.day.textContent = dayName();
        el.balance.textContent = money(state.balance);
        el.balance.setAttribute('data-negative', state.balance < 0 ? 'true' : 'false');

        el.place.hidden = state.phase !== 'place';
        el.result.hidden = state.phase !== 'result';
        el.done.hidden = state.phase !== 'done';

        if (state.phase === 'place') {
            setDie(el.forecastDie, state.forecast);
            el.forecastText.textContent = state.forecast <= 3
                ? 'Good weather predicted.'
                : 'Bad weather predicted.';
            el.split.textContent = inshore + ' inshore, ' + offshore + ' offshore';
            el.radios.forEach(function (radio) {
                radio.checked = parseInt(radio.value, 10) === offshore;
            });
            el.lottery.hidden = dayName() !== 'Tuesday';
            el.cast.textContent = 'Set the pots for ' + dayName();
        }

        if (state.phase === 'result' && state.result) {
            setDie(el.actualDie, state.actual);
            el.resultHeading.textContent = state.result.heading;
            el.resultLines.innerHTML = '';
            state.result.lines.forEach(function (line) {
                var li = document.createElement('li');
                li.textContent = line;
                el.resultLines.appendChild(li);
            });
            el.next.textContent = state.day >= DAYS.length - 1
                ? 'Finish the week'
                : 'On to ' + DAYS[state.day + 1];
        }

        if (state.phase === 'done') {
            el.finalLine.textContent = money(state.balance);
            el.verdict.textContent = verdictFor(state.balance);
            var best = readBest();
            el.best.textContent = best === null
                ? ''
                : 'Your best week so far: ' + money(best) + '.';
        }

        renderLedger();
        scene.sync();
    }

    function verdictFor(balance) {
        var profit = balance - STARTING_BALANCE;
        if (profit <= -20) {
            return 'You have lost a lot of pots. The sea does not care about your forecast.';
        }
        if (profit < 0) {
            return 'Down on the week. The offshore pots are a tempting way to lose ten pounds at a time.';
        }
        if (profit === 0) {
            return 'Exactly even. Statistically impressive, commercially pointless.';
        }
        if (profit < 40) {
            return 'A profit. Modest, but the pots all came home.';
        }
        return 'A very good week. Either you read the forecast properly or the dice liked you.';
    }

    function renderLedger() {
        el.ledgerBody.innerHTML = '';
        state.ledger.forEach(function (row) {
            var tr = document.createElement('tr');
            var day = document.createElement('th');
            day.setAttribute('scope', 'row');
            day.textContent = row.day;
            tr.appendChild(day);
            [
                String(row.inshore),
                String(row.offshore),
                row.current ? 'Yes' : 'No',
                money(row.earned),
                money(row.lost),
                money(row.balance)
            ].forEach(function (value) {
                var td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            el.ledgerBody.appendChild(tr);
        });
    }

    // --- The canvas ------------------------------------------------------
    //
    // A low poly sea: a triangulated mesh whose vertices ride a pair of
    // sine waves, flat shaded by how far each facet has been lifted. The
    // pots sit in fixed slots so they do not skitter about between days.

    var scene = (function () {
        var canvas = el.canvas;
        var ctx = canvas ? canvas.getContext('2d') : null;
        var view = { w: 0, h: 0 };
        var raf = null;
        var time = 0;
        var lastFrame = 0;
        var lastDraw = 0;
        var visible = true;

        var amp = 1;
        var targetAmp = 1;
        var cheer = 0;
        var targetCheer = 0;

        // The camera looks out over the water from just behind the boat.
        // Pitch here is the world's rotation about X: a negative value
        // lifts the horizon up the frame, which is the view we want.
        var CAM = { x: 0, y: 2.35, z: -4.7, pitch: -0.27 };
        var focal = 1;
        var horizonY = 0;

        var LIGHT = unit(-0.46, 0.76, -0.46);
        var AMBIENT = 0.5;
        var FOG_NEAR = 22;
        var FOG_FAR = 150;

        var BOAT = { x: -1.0, z: 0.5, yaw: -0.5, scale: 1.3 };

        // Where the pots go, in world coordinates. Inshore sits in the
        // shallows by the rock; offshore is out towards the horizon.
        var INSHORE = [
            [-3.6, 4.2], [-2.3, 6.4], [-4.7, 7.6],
            [-1.6, 5.0], [-3.2, 9.4], [-1.2, 8.0]
        ];
        var OFFSHORE = [
            [2.6, 10.5], [4.6, 13.5], [1.2, 15.0],
            [5.8, 10.0], [3.2, 17.5], [6.8, 15.0]
        ];

        var reduceMotion = window.matchMedia
            ? window.matchMedia('(prefers-reduced-motion: reduce)')
            : { matches: false };
        var darkScheme = window.matchMedia
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : { matches: false };

        var THEMES = {
            light: {
                skyTop: [242, 245, 245],
                skyLow: [214, 231, 229],
                sea: [36, 150, 142],
                rock: [168, 168, 162],
                hull: [168, 182, 190],
                floor: [150, 122, 88],
                eye: [58, 44, 40],
                jumper: [240, 238, 230],
                skin: [232, 190, 158],
                hat: [223, 120, 70],
                buoyTop: [223, 120, 70],
                buoyLow: [240, 238, 230],
                foam: [255, 255, 255]
            },
            dark: {
                skyTop: [22, 24, 25],
                skyLow: [18, 46, 45],
                sea: [22, 104, 98],
                rock: [92, 94, 92],
                hull: [112, 128, 136],
                floor: [110, 90, 66],
                eye: [42, 32, 30],
                jumper: [206, 203, 194],
                skin: [192, 154, 128],
                hat: [192, 100, 58],
                buoyTop: [192, 100, 58],
                buoyLow: [206, 203, 194],
                foam: [216, 222, 222]
            }
        };

        function theme() {
            return darkScheme.matches ? THEMES.dark : THEMES.light;
        }

        // --- Small vector helpers ---

        function unit(x, y, z) {
            var len = Math.sqrt(x * x + y * y + z * z) || 1;
            return { x: x / len, y: y / len, z: z / len };
        }

        function project(p) {
            var dx = p.x - CAM.x;
            var dy = p.y - CAM.y;
            var dz = p.z - CAM.z;
            var c = Math.cos(CAM.pitch);
            var s = Math.sin(CAM.pitch);
            var y1 = dy * c - dz * s;
            var z1 = dy * s + dz * c;
            if (z1 < 0.3) {
                return null;
            }
            var f = focal / z1;
            return { x: view.w * 0.5 + dx * f, y: view.h * 0.5 - y1 * f, z: z1 };
        }

        // Yaw, then roll, then pitch, then move. Good enough for a boat
        // that only ever leans a few degrees.
        function xform(p, t) {
            var x = p.x;
            var y = p.y;
            var z = p.z;
            var c;
            var s;
            var n;
            if (t.s) {
                x *= t.s;
                y *= t.s;
                z *= t.s;
            }
            if (t.ry) {
                c = Math.cos(t.ry);
                s = Math.sin(t.ry);
                n = x * c + z * s;
                z = -x * s + z * c;
                x = n;
            }
            if (t.rz) {
                c = Math.cos(t.rz);
                s = Math.sin(t.rz);
                n = x * c - y * s;
                y = x * s + y * c;
                x = n;
            }
            if (t.rx) {
                c = Math.cos(t.rx);
                s = Math.sin(t.rx);
                n = y * c - z * s;
                z = y * s + z * c;
                y = n;
            }
            return { x: x + (t.x || 0), y: y + (t.y || 0), z: z + (t.z || 0) };
        }

        // --- Geometry ---

        function quad(out, a, b, c, d, colour) {
            out.push({ v: [a, b, c], c: colour });
            out.push({ v: [a, c, d], c: colour });
        }

        function boxFaces(sx, sy, sz, colour, offset) {
            var ox = offset ? offset.x || 0 : 0;
            var oy = offset ? offset.y || 0 : 0;
            var oz = offset ? offset.z || 0 : 0;
            var hx = sx / 2;
            var hy = sy / 2;
            var hz = sz / 2;
            var v = function (ix, iy, iz) {
                return { x: ox + ix * hx, y: oy + iy * hy, z: oz + iz * hz };
            };
            var a = v(-1, -1, -1);
            var b = v(1, -1, -1);
            var c = v(1, 1, -1);
            var d = v(-1, 1, -1);
            var e = v(-1, -1, 1);
            var f = v(1, -1, 1);
            var g = v(1, 1, 1);
            var h = v(-1, 1, 1);
            var faces = [];
            quad(faces, e, f, g, h, colour);
            quad(faces, b, a, d, c, colour);
            quad(faces, a, e, h, d, colour);
            quad(faces, f, b, c, g, colour);
            quad(faces, h, g, c, d, colour);
            quad(faces, a, b, f, e, colour);
            return faces;
        }

        function coneFaces(radius, height, segments, colour) {
            var faces = [];
            var apex = { x: 0, y: height, z: 0 };
            var centre = { x: 0, y: 0, z: 0 };
            for (var i = 0; i < segments; i++) {
                var a0 = (i / segments) * Math.PI * 2;
                var a1 = ((i + 1) / segments) * Math.PI * 2;
                var p0 = { x: Math.cos(a0) * radius, y: 0, z: Math.sin(a0) * radius };
                var p1 = { x: Math.cos(a1) * radius, y: 0, z: Math.sin(a1) * radius };
                faces.push({ v: [p1, p0, apex], c: colour });
                faces.push({ v: [p0, p1, centre], c: colour });
            }
            return faces;
        }

        function drumFaces(radius, height, segments, colour) {
            var faces = [];
            var top = [];
            var bot = [];
            var i;
            for (i = 0; i < segments; i++) {
                var a = (i / segments) * Math.PI * 2;
                var cx = Math.cos(a) * radius;
                var cz = Math.sin(a) * radius;
                top.push({ x: cx, y: height / 2, z: cz });
                bot.push({ x: cx, y: -height / 2, z: cz });
            }
            var topC = { x: 0, y: height / 2, z: 0 };
            var botC = { x: 0, y: -height / 2, z: 0 };
            for (i = 0; i < segments; i++) {
                var k = (i + 1) % segments;
                quad(faces, bot[i], bot[k], top[k], top[i], colour);
                faces.push({ v: [topC, top[k], top[i]], c: colour });
                faces.push({ v: [botC, bot[i], bot[k]], c: colour });
            }
            return faces;
        }

        var HULL = [
            [0, 1.4], [0.46, 0.66], [0.5, -0.48],
            [0, -1.0], [-0.5, -0.48], [-0.46, 0.66]
        ];

        function hullFaces(side, floor) {
            var faces = [];
            var n = HULL.length;
            var top = [];
            var bot = [];
            for (var i = 0; i < n; i++) {
                top.push({ x: HULL[i][0], y: 0.32, z: HULL[i][1] });
                bot.push({ x: HULL[i][0] * 0.58, y: -0.26, z: HULL[i][1] * 0.58 });
            }
            var centre = { x: 0, y: -0.26, z: 0 };
            for (var j = 0; j < n; j++) {
                var k = (j + 1) % n;
                quad(faces, bot[j], bot[k], top[k], top[j], side);
                faces.push({ v: [centre, bot[j], bot[k]], c: floor });
            }
            return faces;
        }

        function buoyFaces(top, low) {
            var faces = [];
            var segments = 6;
            var r = 0.19;
            var apex = { x: 0, y: 0.3, z: 0 };
            var keel = { x: 0, y: -0.22, z: 0 };
            for (var i = 0; i < segments; i++) {
                var a0 = (i / segments) * Math.PI * 2;
                var a1 = ((i + 1) / segments) * Math.PI * 2;
                var p0 = { x: Math.cos(a0) * r, y: 0.03, z: Math.sin(a0) * r };
                var p1 = { x: Math.cos(a1) * r, y: 0.03, z: Math.sin(a1) * r };
                faces.push({ v: [p1, p0, apex], c: top });
                faces.push({ v: [p0, p1, keel], c: low });
            }
            return faces;
        }

        function rockFaces(colour) {
            var faces = [];
            var segments = 7;
            var radii = [1.9, 1.5, 2.2, 1.7, 2.0, 1.4, 1.8];
            var heights = [0.9, 1.5, 0.7, 1.2, 0.8, 1.6, 1.0];
            var apex = { x: 0.25, y: 2.4, z: 0.1 };
            var ring = [];
            var base = [];
            for (var i = 0; i < segments; i++) {
                var a = (i / segments) * Math.PI * 2;
                ring.push({
                    x: Math.cos(a) * radii[i],
                    y: heights[i],
                    z: Math.sin(a) * radii[i]
                });
                base.push({
                    x: Math.cos(a) * radii[i] * 1.3,
                    y: -0.4,
                    z: Math.sin(a) * radii[i] * 1.3
                });
            }
            for (var j = 0; j < segments; j++) {
                var k = (j + 1) % segments;
                faces.push({ v: [ring[k], ring[j], apex], c: colour });
                quad(faces, base[j], base[k], ring[k], ring[j], colour);
            }
            return faces;
        }

        function discFaces(radius, colour) {
            var faces = [];
            var segments = 6;
            var centre = { x: 0, y: 0, z: 0 };
            for (var i = 0; i < segments; i++) {
                var a0 = (i / segments) * Math.PI * 2;
                var a1 = ((i + 1) / segments) * Math.PI * 2;
                faces.push({
                    v: [
                        { x: Math.cos(a1) * radius, y: 0, z: Math.sin(a1) * radius },
                        { x: Math.cos(a0) * radius, y: 0, z: Math.sin(a0) * radius },
                        centre
                    ],
                    c: colour
                });
            }
            return faces;
        }

        // --- The cast, built once ---

        var hull = null;
        var figure = null;
        var buoy = null;
        var rock = null;
        var foam = null;
        var builtFor = null;

        function build() {
            var t = theme();
            hull = hullFaces(t.hull, t.floor);
            figure = [
                { f: boxFaces(0.36, 0.32, 0.28, t.jumper), t: { y: 0.33 } },
                { f: drumFaces(0.28, 0.32, 10, t.skin), t: { y: 0.72, ry: Math.PI / 10 } },
                { f: drumFaces(0.29, 0.13, 10, t.hat), t: { y: 0.87, ry: Math.PI / 10 } },
                { f: coneFaces(0.29, 0.11, 10, t.hat), t: { y: 0.925 } },
                { f: boxFaces(0.07, 0.075, 0.05, t.eye), t: { x: -0.1, y: 0.74, z: 0.27 } },
                { f: boxFaces(0.07, 0.075, 0.05, t.eye), t: { x: 0.1, y: 0.74, z: 0.27 } },
                { f: boxFaces(0.085, 0.2, 0.085, t.jumper, { y: -0.1 }),
                    t: { x: -0.175, y: 0.42 }, arm: -1 },
                { f: boxFaces(0.085, 0.2, 0.085, t.jumper, { y: -0.1 }),
                    t: { x: 0.175, y: 0.42 }, arm: 1 }
            ];
            buoy = buoyFaces(t.buoyTop, t.buoyLow);
            rock = rockFaces(t.rock);
            foam = discFaces(0.42, t.foam);
            builtFor = darkScheme.matches ? 'dark' : 'light';
        }

        // --- Water ---

        function waveHeight(x, z, t, d) {
            // Damped with distance, or the far rows alias into a mess.
            var damp = 1 / (1 + d * 0.06);
            return (Math.sin(x * 0.55 + t * 1.15) * 0.14
                + Math.sin(z * 0.43 - t * 0.95) * 0.18
                + Math.sin((x * 0.6 + z * 0.5) * 0.62 + t * 1.7) * 0.11) * amp * damp;
        }

        // Deterministic per-vertex phase. Without it the mesh moves as one
        // smooth sheet and the low poly facets never show.
        function vertexChop(c, r, t, d) {
            var n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
            var phase = (n - Math.floor(n)) * Math.PI * 2;
            return Math.sin(t * 1.6 + phase) * 0.15 * Math.sqrt(amp) / (1 + d * 0.06);
        }

        function surfaceAt(x, z) {
            return waveHeight(x, z, time, z - CAM.z);
        }

        // --- Rendering ---

        function resize() {
            if (!ctx) {
                return;
            }
            var rect = canvas.getBoundingClientRect();
            if (rect.width === 0) {
                return;
            }
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            view.w = rect.width;
            view.h = rect.height;
            focal = view.h * 0.92;
            horizonY = view.h * 0.5 + focal * Math.tan(CAM.pitch);
            draw();
        }

        function rgb(c) {
            return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
        }

        function pushFace(out, face, fog, water) {
            var v = face.v;
            var ux = v[1].x - v[0].x;
            var uy = v[1].y - v[0].y;
            var uz = v[1].z - v[0].z;
            var vx = v[2].x - v[0].x;
            var vy = v[2].y - v[0].y;
            var vz = v[2].z - v[0].z;
            var nx = uy * vz - uz * vy;
            var ny = uz * vx - ux * vz;
            var nz = ux * vy - uy * vx;
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= len;
            ny /= len;
            nz /= len;
            if (water) {
                if (ny < 0) {
                    nx = -nx;
                    ny = -ny;
                    nz = -nz;
                }
                nx *= 6;
                nz *= 6;
                var wl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                nx /= wl;
                ny /= wl;
                nz /= wl;
            }
            var lambert = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
            var k = AMBIENT + (1 - AMBIENT) * Math.max(0, lambert);

            var a = project(v[0]);
            var b = project(v[1]);
            var c = project(v[2]);
            if (!a || !b || !c) {
                return;
            }
            // Everything off the top, bottom or sides can be skipped.
            var minX = Math.min(a.x, b.x, c.x);
            var maxX = Math.max(a.x, b.x, c.x);
            var minY = Math.min(a.y, b.y, c.y);
            var maxY = Math.max(a.y, b.y, c.y);
            if (maxX < -2 || minX > view.w + 2 || maxY < -2 || minY > view.h + 2) {
                return;
            }

            var depth = (a.z + b.z + c.z) / 3;
            var base = face.c;
            var r = base[0] * k;
            var g = base[1] * k;
            var bl = base[2] * k;
            if (fog) {
                var m = (depth - FOG_NEAR) / (FOG_FAR - FOG_NEAR);
                m = m < 0 ? 0 : (m > 1 ? 1 : m);
                m *= 0.96;
                r += (fog[0] - r) * m;
                g += (fog[1] - g) * m;
                bl += (fog[2] - bl) * m;
            }
            out.push({ a: a, b: b, c: c, depth: depth, fill: rgb([r, g, bl]) });
        }

        function collectSea(out, t) {
            var cols = Math.max(8, Math.min(17, Math.round(view.w / 50)));
            var rows = Math.max(8, Math.min(13, Math.round(view.h / 40)));
            var near = 1.4;
            var far = 210;
            var prev = null;
            for (var r = 0; r <= rows; r++) {
                var d = near + (far - near) * Math.pow(r / rows, 2.7);
                var z = CAM.z + d;
                var half = (view.w * 0.5) * d / focal * 1.3 + 2;
                var row = [];
                for (var c = 0; c <= cols; c++) {
                    var x = -half + 2 * half * (c / cols);
                    row.push({
                        x: x,
                        y: waveHeight(x, z, time, d) + vertexChop(c, r, time, d),
                        z: z
                    });
                }
                if (prev) {
                    for (var i = 0; i < cols; i++) {
                        pushFace(out, { v: [prev[i], prev[i + 1], row[i + 1]], c: t.sea },
                            t.skyLow, true);
                        pushFace(out, { v: [prev[i], row[i + 1], row[i]], c: t.sea },
                            t.skyLow, true);
                    }
                }
                prev = row;
            }
        }

        function collectObject(out, faces, tr, t) {
            for (var i = 0; i < faces.length; i++) {
                var f = faces[i];
                pushFace(out, {
                    v: [xform(f.v[0], tr), xform(f.v[1], tr), xform(f.v[2], tr)],
                    c: f.c
                }, t.skyLow, false);
            }
        }

        function floatTransform(x, z, extraYaw, scale) {
            var d = z - CAM.z;
            var e = 0.7;
            var lean = function (a, b) {
                var r = Math.atan2(a - b, 2 * e);
                return r < -0.26 ? -0.26 : (r > 0.26 ? 0.26 : r);
            };
            var roll = lean(waveHeight(x + e, z, time, d),
                waveHeight(x - e, z, time, d));
            var pitch = lean(waveHeight(x, z + e, time, d),
                waveHeight(x, z - e, time, d));
            return {
                x: x,
                y: waveHeight(x, z, time, d),
                z: z,
                rx: -pitch,
                rz: roll,
                ry: extraYaw || 0,
                s: scale || 1
            };
        }

        function drawSky(t) {
            var grad = ctx.createLinearGradient(0, 0, 0, Math.max(horizonY, 1));
            grad.addColorStop(0, rgb(t.skyTop));
            grad.addColorStop(1, rgb(t.skyLow));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, view.w, horizonY + 1);
            // Anything the mesh fails to cover reads as distant water.
            ctx.fillStyle = rgb(t.skyLow);
            ctx.fillRect(0, horizonY, view.w, view.h - horizonY);
        }

        function draw() {
            if (!ctx || view.w === 0) {
                return;
            }
            var t = theme();
            if (builtFor !== (darkScheme.matches ? 'dark' : 'light')) {
                build();
            }
            drawSky(t);

            var list = [];
            collectSea(list, t);
            collectObject(list, rock, { x: -7.6, y: -0.75, z: 11.5, ry: 0.6, s: 0.85 }, t);

            var offshore = state.offshore;
            var inshore = POTS - offshore;
            var wrecked = state.phase === 'result' && state.current;
            var i;
            for (i = 0; i < inshore; i++) {
                collectObject(list, buoy,
                    floatTransform(INSHORE[i][0], INSHORE[i][1]), t);
            }
            for (i = 0; i < offshore; i++) {
                var slot = OFFSHORE[i];
                if (wrecked) {
                    collectObject(list, foam,
                        { x: slot[0], y: surfaceAt(slot[0], slot[1]) + 0.02, z: slot[1] }, t);
                } else {
                    collectObject(list, buoy, floatTransform(slot[0], slot[1]), t);
                }
            }

            // The boat, and whoever is in it.
            var boatT = floatTransform(BOAT.x, BOAT.z, BOAT.yaw, BOAT.scale);
            collectObject(list, hull, boatT, t);

            // The figure turns to face the camera regardless of the hull's
            // heading, and nods along with the swell.
            var seat = {
                y: 0.17,
                z: -0.18,
                ry: Math.PI - BOAT.yaw + 0.18 + Math.sin(time * 0.6) * 0.09
            };
            for (i = 0; i < figure.length; i++) {
                var part = figure[i];
                var local = part.t;
                if (part.arm) {
                    local = {
                        x: local.x,
                        y: local.y,
                        rz: part.arm * (0.1 + cheer * 2.0)
                    };
                }
                var composed = [];
                for (var j = 0; j < part.f.length; j++) {
                    var f = part.f[j];
                    composed.push({
                        v: [
                            xform(xform(xform(f.v[0], local), seat), boatT),
                            xform(xform(xform(f.v[1], local), seat), boatT),
                            xform(xform(xform(f.v[2], local), seat), boatT)
                        ],
                        c: f.c
                    });
                }
                collectObject(list, composed, {}, t);
            }

            list.sort(function (p, q) { return q.depth - p.depth; });

            for (i = 0; i < list.length; i++) {
                var tri = list[i];
                ctx.beginPath();
                ctx.moveTo(tri.a.x, tri.a.y);
                ctx.lineTo(tri.b.x, tri.b.y);
                ctx.lineTo(tri.c.x, tri.c.y);
                ctx.closePath();
                ctx.fillStyle = tri.fill;
                ctx.fill();
                // Hairline in the same colour, or antialiasing leaves pale
                // threads along every shared edge.
                ctx.strokeStyle = tri.fill;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        function frame(now) {
            raf = null;
            var delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0.016;
            lastFrame = now;
            time += delta;
            amp += (targetAmp - amp) * Math.min(delta * 2.4, 1);
            cheer += (targetCheer - cheer) * Math.min(delta * 4.5, 1);
            // Around 32 frames a second is plenty for a gentle swell, and
            // halves the work on a phone.
            if (now - lastDraw >= 30) {
                lastDraw = now;
                draw();
            }
            schedule();
        }

        function schedule() {
            if (raf !== null || reduceMotion.matches || !visible || document.hidden) {
                return;
            }
            raf = window.requestAnimationFrame(frame);
        }

        function stop() {
            if (raf !== null) {
                window.cancelAnimationFrame(raf);
                raf = null;
            }
            lastFrame = 0;
        }

        function sync() {
            var rough = state.phase === 'result' && state.current;
            targetAmp = rough ? 1.9 : 1;
            targetCheer = (state.phase === 'result' && !state.current) ? 1 : 0;
            if (state.phase === 'done') {
                targetCheer = state.balance > STARTING_BALANCE ? 1 : 0;
            }
            if (reduceMotion.matches) {
                amp = targetAmp;
                cheer = targetCheer;
                draw();
            } else {
                schedule();
            }
        }

        function listen(query, handler) {
            if (query.addEventListener) {
                query.addEventListener('change', handler);
            } else if (query.addListener) {
                query.addListener(handler);
            }
        }

        function init() {
            if (!ctx) {
                return;
            }
            build();
            resize();

            if (window.ResizeObserver) {
                new window.ResizeObserver(resize).observe(canvas);
            } else {
                window.addEventListener('resize', resize);
            }

            if (window.IntersectionObserver) {
                new window.IntersectionObserver(function (entries) {
                    visible = entries[0].isIntersecting;
                    if (visible) {
                        schedule();
                    } else {
                        stop();
                    }
                }).observe(canvas);
            }

            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    stop();
                } else {
                    schedule();
                }
            });

            listen(reduceMotion, function () {
                stop();
                sync();
            });
            listen(darkScheme, function () {
                build();
                draw();
            });
        }

        return { init: init, sync: sync, draw: draw };
    }());

    // --- Wiring ----------------------------------------------------------

    el.radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            state.offshore = parseInt(radio.value, 10);
            render();
        });
    });

    if (el.lotteryPick) {
        el.lotteryPick.addEventListener('change', function () {
            state.lotteryPick = parseInt(el.lotteryPick.value, 10);
        });
    }

    el.cast.addEventListener('click', cast);
    el.next.addEventListener('click', nextDay);
    el.restart.addEventListener('click', restart);

    // The markup ships in a no-JavaScript state; switch it on now that we
    // know the script has actually run.
    root.setAttribute('data-ready', 'true');

    state = freshState();
    scene.init();
    startDay();
}());
