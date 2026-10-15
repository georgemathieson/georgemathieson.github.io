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
        return (n < 0 ? '-$' : '$') + Math.abs(n);
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
            return 'Down on the week. The offshore pots are a tempting way to lose ten dollars at a time.';
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
        var amplitude = 4;
        var targetAmplitude = 4;
        var visible = true;

        var HORIZON = 0.32;
        // Where the light comes from, in the mesh's own space. Facets are
        // flat shaded against this, which is what gives the low poly look.
        var LIGHT = [-0.42, 0.80, -0.43];

        var reduceMotion = window.matchMedia
            ? window.matchMedia('(prefers-reduced-motion: reduce)')
            : { matches: false };
        var darkScheme = window.matchMedia
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : { matches: false };

        var PALETTES = {
            light: {
                sky: ['#fbfbfb', '#f2f2f2', '#e8e8e8'],
                sea: ['#c3ece6', '#a2ded6', '#7fd4cb', '#5cc3b8', '#4db6ac',
                    '#26a69a', '#0f8f84', '#008080', '#00706f', '#005f5f'],
                land: ['#8a8a8a', '#6b6b6b', '#4f4f4f', '#3a3a3a'],
                pot: '#111111',
                potShade: '#4a4a4a',
                pennant: '#ffffff',
                foam: '#ffffff'
            },
            dark: {
                sky: ['#232323', '#1b1b1b', '#131313'],
                sea: ['#4ec4b6', '#3fb3a6', '#34a195', '#2b8f84', '#237d74',
                    '#1c6b63', '#155953', '#0f4743', '#0a3634', '#072725'],
                land: ['#3a3a3a', '#2c2c2c', '#202020', '#161616'],
                pot: '#ececec',
                potShade: '#8e8e8e',
                pennant: '#ececec',
                foam: '#cfcfcf'
            }
        };

        // Fixed slots, as fractions of the sea area. The second number is
        // nearness: 1 is right under your nose, 0 is on the horizon. The
        // inshore ones sit clear of the headland on the left.
        var INSHORE_SLOTS = [
            [0.30, 0.86], [0.46, 0.70], [0.24, 0.62],
            [0.42, 0.97], [0.56, 0.79], [0.35, 0.50]
        ];
        var OFFSHORE_SLOTS = [
            [0.64, 0.26], [0.79, 0.34], [0.89, 0.19],
            [0.71, 0.43], [0.57, 0.14], [0.93, 0.45]
        ];

        function palette() {
            return darkScheme.matches ? PALETTES.dark : PALETTES.light;
        }

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
            view.w = rect.width;
            view.h = rect.height;
            draw();
        }

        // Deterministic per-vertex noise. Without it the mesh shades into
        // smooth horizontal bands instead of reading as separate facets.
        function noise(c, r) {
            var n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
            return n - Math.floor(n);
        }

        function waveAt(x, t, amp) {
            return Math.sin(x * 0.016 + t) * amp
                + Math.sin(x * 0.041 - t * 1.37) * amp * 0.45;
        }

        function triangle(a, b, c, fill) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            // A hairline in the same colour closes the seams that
            // antialiasing would otherwise leave as pale threads.
            ctx.strokeStyle = fill;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        function drawSky(p) {
            var horizon = view.h * HORIZON;
            var bands = p.sky.length;
            for (var i = 0; i < bands; i++) {
                ctx.fillStyle = p.sky[i];
                ctx.fillRect(0, (horizon / bands) * i - 0.5,
                    view.w, horizon / bands + 1);
            }
        }

        function seaGrid(t, amp) {
            var horizon = view.h * HORIZON;
            var depth = view.h - horizon;
            var cols = Math.max(7, Math.min(20, Math.round(view.w / 38)));
            var rows = 9;
            var step = view.w / cols;
            var grid = [];
            for (var r = 0; r <= rows; r++) {
                var tr = r / rows;
                var scale = 0.06 + tr * tr;
                var baseY = horizon + depth * tr * tr;
                if (r === rows) {
                    // Overshoot the bottom edge so no gap opens up when the
                    // last row of waves rides high.
                    baseY = view.h + amp * 4 + 24;
                }
                var row = [];
                for (var c = 0; c <= cols; c++) {
                    var x = step * c + (noise(c, r) - 0.5) * step * 0.55 * tr;
                    if (c === 0) {
                        x = -4;
                    } else if (c === cols) {
                        x = view.w + 4;
                    }
                    var lift = r === 0 ? 0
                        : waveAt(x + r * 31, t + r * 0.5, amp * scale)
                            + (noise(c + 53, r) - 0.5) * amp * scale * 2.6;
                    row.push({
                        x: x,
                        y: baseY + lift,
                        // The same vertex as a point on a height field, so
                        // each facet can be given a real surface normal.
                        X: x,
                        Y: -lift * 2.6,
                        Z: r * 34
                    });
                }
                grid.push(row);
            }
            return { grid: grid, cols: cols, rows: rows, horizon: horizon };
        }

        function faceShade(a, b, c) {
            var ux = b.X - a.X;
            var uy = b.Y - a.Y;
            var uz = b.Z - a.Z;
            var vx = c.X - a.X;
            var vy = c.Y - a.Y;
            var vz = c.Z - a.Z;
            var nx = uy * vz - uz * vy;
            var ny = uz * vx - ux * vz;
            var nz = ux * vy - uy * vx;
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= len;
            ny /= len;
            nz /= len;
            if (ny < 0) {
                nx = -nx;
                ny = -ny;
                nz = -nz;
            }
            return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        }

        function seaColour(p, rowRatio, shade) {
            var ramp = p.sea;
            var base = rowRatio * (ramp.length - 1) * 0.8;
            var index = Math.round(base + (LIGHT[1] - shade) * 7);
            return ramp[Math.max(0, Math.min(ramp.length - 1, index))];
        }

        function drawSea(p, t, amp) {
            var g = seaGrid(t, amp);
            for (var r = 0; r < g.rows; r++) {
                var rowRatio = r / (g.rows - 1);
                for (var c = 0; c < g.cols; c++) {
                    var tl = g.grid[r][c];
                    var tr2 = g.grid[r][c + 1];
                    var bl = g.grid[r + 1][c];
                    var br = g.grid[r + 1][c + 1];
                    triangle(tl, tr2, bl, seaColour(p, rowRatio, faceShade(tl, tr2, bl)));
                    triangle(tr2, br, bl, seaColour(p, rowRatio, faceShade(tr2, br, bl)));
                }
            }
            return g;
        }

        function drawHeadland(p) {
            var horizon = view.h * HORIZON;
            var h = view.h;
            var w = view.w;
            var at = function (fx, fy) {
                return { x: w * fx, y: horizon + (h - horizon) * fy };
            };
            var back = at(-0.02, 0.05);
            var ridge = at(0.07, 0.11);
            var peak = at(0.13, 0.08);
            var tip = at(0.21, 0.27);
            var mid = at(0.11, 0.41);
            var left = at(-0.02, 0.34);
            var foot = at(0.04, 0.70);
            var edge = at(-0.02, 0.66);
            var bottomLeft = { x: w * -0.02, y: h + 4 };
            var bottomMid = { x: w * 0.09, y: h + 4 };

            triangle(back, peak, ridge, p.land[0]);
            triangle(back, ridge, left, p.land[2]);
            triangle(peak, tip, ridge, p.land[1]);
            triangle(ridge, tip, mid, p.land[3]);
            triangle(ridge, mid, left, p.land[2]);
            triangle(left, mid, foot, p.land[1]);
            triangle(left, foot, edge, p.land[3]);
            triangle(edge, foot, bottomLeft, p.land[2]);
            triangle(foot, bottomMid, bottomLeft, p.land[1]);
        }

        function potPosition(slot, g, amp, t) {
            var horizon = g.horizon;
            var depth = view.h - horizon;
            var near = slot[1];
            var baseY = horizon + depth * near * near;
            var x = slot[0] * view.w;
            var scale = 0.06 + near * near;
            var y = baseY + waveAt(x + 13, t + near * 1.4, amp * scale);
            return { x: x, y: y, size: 5 + near * 13 };
        }

        function drawPot(p, pos) {
            var s = pos.size;
            var x = pos.x;
            var y = pos.y;
            var top = y - s * 0.72;
            var shoulder = y - s * 0.3;
            var keel = { x: x, y: y + s * 0.3 };
            // A flat topped float in three facets, so it still reads as a
            // solid object when it is only ten pixels across.
            triangle({ x: x - s * 0.5, y: shoulder }, { x: x - s * 0.26, y: top },
                keel, p.potShade);
            triangle({ x: x - s * 0.26, y: top }, { x: x + s * 0.26, y: top },
                keel, p.pot);
            triangle({ x: x + s * 0.26, y: top }, { x: x + s * 0.5, y: shoulder },
                keel, p.potShade);
            // Mast and pennant.
            ctx.strokeStyle = p.pot;
            ctx.lineWidth = Math.max(1, s * 0.1);
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top - s * 0.9);
            ctx.stroke();
            triangle({ x: x, y: top - s * 0.9 },
                { x: x + s * 0.55, y: top - s * 0.68 },
                { x: x, y: top - s * 0.42 }, p.pennant);
        }

        function drawWreck(p, pos) {
            var s = pos.size * 0.75;
            triangle({ x: pos.x - s, y: pos.y },
                { x: pos.x - s * 0.3, y: pos.y - s * 0.55 },
                { x: pos.x + s * 0.2, y: pos.y }, p.foam);
            triangle({ x: pos.x - s * 0.1, y: pos.y },
                { x: pos.x + s * 0.5, y: pos.y - s * 0.35 },
                { x: pos.x + s, y: pos.y }, p.foam);
        }

        function draw() {
            if (!ctx || view.w === 0) {
                return;
            }
            var p = palette();
            ctx.clearRect(0, 0, view.w, view.h);
            drawSky(p);
            var g = drawSea(p, time, amplitude);
            drawHeadland(p);

            var offshore = state.offshore;
            var inshore = POTS - offshore;
            var wrecked = state.phase === 'result' && state.current;

            // Offshore first, so the nearer inshore pots overlap them.
            for (var i = 0; i < offshore; i++) {
                var op = potPosition(OFFSHORE_SLOTS[i], g, amplitude, time);
                if (wrecked) {
                    drawWreck(p, op);
                } else {
                    drawPot(p, op);
                }
            }
            for (var j = 0; j < inshore; j++) {
                drawPot(p, potPosition(INSHORE_SLOTS[j], g, amplitude, time));
            }
        }

        function frame(now) {
            raf = null;
            var delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0.016;
            lastFrame = now;
            time += delta;
            amplitude += (targetAmplitude - amplitude) * Math.min(delta * 3, 1);
            draw();
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
            // Rough water on a day the current ran, glassy otherwise.
            targetAmplitude = (state.phase === 'result' && state.current) ? 13 : 4;
            if (reduceMotion.matches) {
                amplitude = targetAmplitude;
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
            listen(darkScheme, draw);
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
