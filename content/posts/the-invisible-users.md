---
title: "The Invisible Users"
date: 2026-05-20
tags: [accessibility, ux, design]
summary: "Just got back from UX London and honestly, the talks on accessibility hit different. Time to make inclusivity a first-class feature, not an afterthought."
---

Just got back from UX London and honestly, the talks on accessibility hit different. As engineers, we're often the ones shipping features without thinking about who gets left behind. Spoiler: it's way more people than we think. Time to make inclusivity a first-class feature, not an afterthought.

## What I learned

Sitting in the accessibility workshops, a few things became crystal clear. First, accessibility isn't a feature. It's not something you bolt on at the end like a UI polish pass. It's a fundamental part of how you architect your application from day one.

We heard stories from developers with visual impairments struggling to use certain dev tools. Users relying on screen readers trying to navigate poorly structured HTML. People with motor disabilities frustrated by tiny click targets. These aren't edge cases — these are real people using real applications we build.

## The numbers say it all

Here's the thing: approximately 1 in 4 adults in the US have some type of disability. That's not a niche concern. That's mainstream. Yet how many of our applications are actually built with this in mind? I'd wager... not many.

The business case is there too:

- Better accessibility = better SEO fundamentals
- Keyboard navigation benefits power users
- Captions help in noisy environments (and when you've got sound muted)
- Clearer information hierarchy helps everyone
- Better code structure = easier to maintain

## Where we go wrong

The biggest mistake I see? Building first, thinking about accessibility never. We ship a feature, QA tests it on a mouse and keyboard, it works... and we ship it. We don't test with actual assistive technology. We don't validate our HTML semantics. We don't test keyboard navigation. We don't check colour contrast.

It's not malice. It's just... not top of mind. And that's something we can change. Today.

## What I'm taking away

Going forward, I'm making accessibility part of my definition of "done". That means:

- Semantic HTML from the start
- Keyboard navigation testing
- WCAG compliance checks in our CI/CD
- Screen reader testing (not just automated tools)
- Colour contrast validation
- Actually involving people with disabilities in user testing

The invisible users aren't really invisible. We just haven't been looking hard enough. It's time to change that.
