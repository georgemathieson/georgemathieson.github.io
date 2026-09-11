---
title: "The Process Is Fine (Everything Is Late)"
date: 2026-09-11T06:00:00+00:00
tags: [delivery, flow, process]
summary: "The ceremonies all happen, the board is immaculate, and the deadlines are still whooshing past. A post about wonky floors, parcel tracking, and why your process audit keeps coming back clean."
---

Do you know how hard it is to hang wardrobe doors? I do, because I once spent an entire Sunday assembling a flat-pack wardrobe. Every screw in the right hole, every cam lock turned to exactly the little arrow. The doors would not line up. One sat a centimetre proud of the other, like a tooth that had given up. I went back through the manual three times looking for the step I'd missed.

There was no missed step. The manual was fine. The wardrobe was fine. My bedroom floor, it turned out, dips about fifteen millimetres towards the window, because Victorian builders were artists and artists don't own spirit levels. No amount of re-reading the instructions was ever going to fix that.

![An artist's impression of a bedroom floor sloping gently but decisively towards a window](floor.png "The floor in question, as remembered. Not pictured: the spirit level I did not own.")

I think about that wardrobe every time a team tells me their process is fine.

## The symptoms

And look, on paper it usually *is* fine. Standups happen at 9:30 sharp. The backlog is refined. Estimates are estimated. Retros produce action items, and some of them even get done. The board has columns and the columns have tickets and the tickets have acceptance criteria.

And yet: deadlines slip. Work crawls. Everything is "in progress" and nothing is finished. QA gets flattened every sprint like a seaside town in a disaster film, always on the last two days. And the sprint goal, that sentence someone carefully typed on planning day, gets read aloud once and is never spoken of again, like a wish.

Here's the uncomfortable bit. If the process were the problem, changing the process would have fixed it by now. And you've changed it. You've tried shorter standups, longer refinement, new estimation scales, a different board layout. The doors still don't line up.

Stop re-reading the manual. Check the floor.

## Follow the parcel

I once tracked a parcel that was "in transit" for nine days. Nine days! It travelled forty miles. I have walked further for a decent bacon roll. Of course, the parcel wasn't really in transit. It was sitting in a cage in a depot, perfectly stationary, while the tracking page radiated optimism.

Your tickets are that parcel. A ticket that was "in progress" for two weeks was probably actively worked on for a few hours. The rest of its life was spent waiting: waiting for a code review, waiting for an answer from the product owner, waiting for an environment, waiting for QA to surface from the pile you buried them under last Thursday. The board says movement. The work is in a cage.

So here's the dig. No new framework required, just an honest afternoon:

- **Autopsy five tickets.** Take the last five things you finished and draw each one's timeline, hour by hour. Colour in "someone was actually working on this" versus "this was waiting for something". The ratio will upset you. Good. It's supposed to.
- **Count what's open.** Tally how many items each person has in flight. I own one hob with four rings and I have still burnt dinner by attempting six things on it. If everyone is cooking three tickets, nobody is finishing any of them, and every hand-off is a chance to wait.
- **Ask when QA receives work, not how much.** If the answer is "Thursday, all of it", your QA isn't under-resourced. You've got a kitchen where the whole restaurant orders dessert at the same moment. The pile at the end of the sprint isn't a testing problem, it's a batching problem, and it was created on Monday.
- **Read the sprint goal, then read the board.** If the goal says "launch the new checkout" and the board is ten unrelated tickets, then it was never a goal. It was a caption. Ten people rowing ten little boats will all row very hard and arrive at ten different places.

## What this buys you

Once you've looked, the fixes mostly suggest themselves, and none of them are ceremonies. Make the waiting visible: if work queues in front of review or QA, give that queue a column so it stops hiding inside "in progress". Put a limit on how much the team has open at once, and when someone's free, have them finish something rather than start something. Slice work small enough that the first piece reaches QA on Tuesday, not Thursday. And pick sprint goals modest enough that most of the team is actually rowing the same boat.

Then take the ticket timelines to your next retro instead of feelings. "Waiting for review was 60% of our cycle time" is a much better conversation starter than "communication could be better".

The point is this: process is the assembly manual, and flow is the floor it's standing on. When the doors don't line up and the manual checks out, the manual is the wrong place to keep looking. A spirit level costs about five quid. Go and hold it against your board.
