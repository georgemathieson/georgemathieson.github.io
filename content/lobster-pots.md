---
title: "Lobster Pots"
description: "A dice game about probability, profit and loss, played solo against a seven day week. Six pots, two dice, and one number the forecast quietly gives away."
lead: "Six lobster pots, seven days, and a sea that keeps eating your equipment. We played this in maths at school. I have rebuilt it here."
layout: lobster-pots
---

You run a lobster business. You have six pots and fifty dollars. Every morning
you decide how many pots go in the shallow water near the shore, where the
catch is small and safe, and how many go out into the deep, where the catch is
much better and a bad day destroys them.

A week later, whatever is left is your score.

## How a day works

A die is rolled for the forecast. One, two or three means good weather is
predicted. Four, five or six means bad.

You place your pots. Then a second die is rolled for the actual weather. If it
comes in **under** the forecast, a current runs. Otherwise the water stays calm.

| | Inshore | Offshore |
| --- | --- | --- |
| No current | earns $2 a pot | earns $6 a pot |
| Current | earns $4 a pot | destroyed, $10 a pot to replace |

You must always have six pots, so anything the sea takes has to be bought back
the same day. If that puts you in debt, you go into debt.

## The decision

Here is the thing the game does not tell you, and the reason it was worth
twenty minutes of a maths lesson.

The forecast die is not a mood. It is a probability. A current runs when the
second roll lands under the first, so a forecast of F means a current with
probability (F - 1) / 6. That is the whole game in one line.

Work the expected value per pot and the picture is flat:

| Forecast | Chance of a current | Inshore | Offshore |
| --- | --- | --- | --- |
| 1 | 0% | $2.00 | **$6.00** |
| 2 | 17% | $2.33 | **$3.33** |
| 3 | 33% | **$2.67** | $0.67 |
| 4 | 50% | **$3.00** | -$2.00 |
| 5 | 67% | **$3.33** | -$4.67 |
| 6 | 83% | **$3.67** | -$7.33 |

Offshore is only worth it when the chance of a current is under about two in
nine. In practice: go deep on a one or a two, and keep everything inshore from
three upwards.

## The trap on a "good" day

Look at the row for three.

The game tells you good weather is predicted. It is technically right, three is
in the good half. But a third of the time a current still runs, and that is
already enough to make the deep water a losing bet. Offshore returns 67 cents a
pot against inshore's $2.67.

So the player who listens to the forecast loses money to the player who reads
the number behind it. I like that a lot. It is a very small, very cheap lesson
about the difference between a label and a measurement, and it is doing it to
fourteen year olds with two dice.

## The three odd days

Three days behave differently, which is where the rest of the syllabus sneaks in.

**Tuesday** is a lottery. Pick the sum of two dice and win $100 if you call it.
The honest answer is seven, which comes up six times in thirty six, worth $16.67
on average. Any other guess is worse, and two and twelve are worth $2.78.

**Thursday** is tax day. Eight per cent of your profit so far, and nothing at all
if you have not made any. Losing money has never felt so rewarding.

**Saturday** pays ten per cent interest on a positive balance. The rules let the
person running the game decide whether a debt grows on a Saturday too. I have
been kind: in this version it does not.

## Where it comes from

The version I have built is the one published by [the National Math
Club](https://www.mathcounts.org/) at MATHCOUNTS, who are refreshingly honest
that they did not invent it either and have never managed to trace where it came
from. If you know, they would like to hear from you.

Their original is a classroom game: a teacher with two dice, a room full of
students, and a photocopied table. That version is better than this one, because
the interesting part is arguing with the person next to you about whether to go
deep. This is just the solitaire edition, for when there is nobody to argue with.
