# GlobalBooks

**A worldwide online bookstore website, built to work on any phone, with no JavaScript.**

---

## 1. What this project is

GlobalBooks is a one-page website for a bookstore that sells books for four kinds of readers: kids, teens, adults and students. The site shows the books, tells visitors about shipping and returns, and lets them order or sign up for a weekly deal email.

This version was rebuilt from an earlier one that relied on a JavaScript file. Everything now comes from plain page structure and styling, so the site is lighter, loads faster and is easier to maintain.

---

## 2. The goal

- Remove the JavaScript completely.
- Make the site flexible enough for many different smartphones, from small older screens to large modern ones.
- Add videos.
- Add images that move.

---

## 3. What a visitor sees, from top to bottom

1. **Top bar:** the logo, an Order button and a menu button on phones. On larger screens the menu shows as a row of links.
2. **Hero:** a headline over a looping background video, with floating book covers and quick links to the four reader groups.
3. **Benefits strip:** global shipping, fair prices, easy returns and secure ordering.
4. **Trending strip:** a slowly scrolling row of every book cover.
5. **Kids, Teens and Adults shelves:** each book has a cover, title, author, age or type, short description, price and an Order button.
6. **Book of the month:** one highlighted title with a swaying cover.
7. **Video section:** a 14-second vertical video touring all reader groups.
8. **Students shelf:** study guides and academic reads.
9. **Newsletter:** an email box for the Friday book deal.
10. **Footer:** shop links, support links and contact email.

---

## 4. How it works without JavaScript

| What visitors do | How it works now |
|---|---|
| Open the phone menu | The menu button links to the menu itself, and the menu opens. Tapping any section link closes it again. |
| Browse books | All 16 books are written directly into the page, so nothing has to be drawn after loading. |
| Swipe through books on a phone | Each shelf is a sideways swipe row that snaps card by card. |
| See book covers | Covers are ready-made picture files instead of being drawn on the fly. |
| Order a book | The Order button opens an email with the book title already filled in. |
| Subscribe | The form opens an email to the shop. |

---

## 5. Videos

- **Hero background video:** an 8-second loop of floating covers. It plays by itself, silently, and stays inside the page on iPhone instead of jumping to fullscreen.
- **"GlobalBooks in 14 seconds":** a vertical video with one colorful scene for each reader group, ending with the shipping promise. It has play controls and only downloads when a visitor taps play, which saves mobile data.
- Both videos are small, about 200 KB each.
- These two videos are simple generated placeholders. Replace them with real footage whenever you have it.

---

## 6. Moving images

- Hero covers float gently up and down.
- The trending strip scrolls forever and pauses when a mouse hovers over it.
- The book of the month cover sways side to side.
- Section titles fade in as the visitor scrolls down, in browsers that support it.
- Book cards lift slightly when a mouse hovers over them.
- Visitors who have reduced motion turned on in their device settings get none of this. The videos and animations stay still for them.

---

## 7. Built for many phones

- **Fits any width:** from very small screens up to tablets and desktops, with no sideways scrolling.
- **Notches and rounded corners:** content stays clear of them, in portrait and landscape.
- **Landscape phones:** the top of the page becomes shorter so content is not squeezed.
- **Touch friendly:** buttons are large enough to tap comfortably.
- **Text size:** the headline scales smoothly with the screen instead of jumping between sizes.
- **Mobile data:** images load as the visitor scrolls, and the big video waits for a tap.
- **Email field:** it opens the right keyboard and does not make iPhone zoom in.

---

## 8. What was removed, and why

Without JavaScript, a page cannot remember things or react to typing. These features were removed as a result:

- The shopping cart and checkout
- The language switcher (English only now)
- The currency switcher (prices are in US dollars)
- The live search box
- The book detail pop-ups (the description now shows on each card)

---

## 9. What is in the project folder

- **index.html:** the whole page.
- **css folder:** one styling file that controls every color, layout and animation.
- **assets, covers:** 16 book cover pictures.
- **assets, video:** two videos and their preview pictures.
- **README:** this file.

---

## 10. How to use it

- **Preview:** open the index file in any web browser. No installation or server is needed.
- **Publish:** upload the whole folder to any basic web host. It is only files, so even the cheapest hosting works.

---

## 11. How to change things

- **Books, prices and descriptions:** edit the matching card in the index file.
- **Colors and fonts:** change the color list at the top of the styling file.
- **Videos:** replace the two video files and their preview pictures with your own, keeping the same names.
- **Order email address:** replace the sample address everywhere it appears.
- **Cover pictures:** replace any cover file with a real book cover, keeping the same name.

---

## 12. Good next steps

- Connect real checkout with a payment link for each book.
- Connect the newsletter form to an email service.
- Add separate German, Spanish and French pages.
- Replace the placeholder videos with real footage.
- Replace the generated covers with real book covers.
