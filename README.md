# GlobalBooks

![GlobalBooks home page](docs/images/home-top.png)

## What is this website for?

GlobalBooks is an online bookstore made for one simple idea: **every kind of reader should feel like the shop was made for them.**

Most bookstores put everything on one long list. Here, you start by saying who you're shopping for, and you land on a shelf that looks and sounds right for that person:

- **Kids** get bright colours, cartoons and picture books.
- **Teens** get a bold, loud look and stories about their world.
- **Adults** get a calmer, classic look with novels, history and non-fiction.
- **Students** get a notebook feel with study guides and academic books.
- **Scientists** get a lab-style look with research and science titles.

The shop promises to ship to over 180 countries, keep prices fair, and take returns without fuss. It's meant to feel friendly and easy for someone who just wants to find a good book and order it.

I built it as my web development course project, to practise making a site that reacts to what people do instead of just showing static pages.

## What a visitor can do

**Pick who they're shopping for.** The home page starts with a tile for each reader group.

![Choosing a reader group](docs/images/home-choose.png)

**Browse a shelf made for that reader.** Each group has its own banner, colours and drawings.

![The kids shelf](docs/images/kids-top.png)

**Filter books by price.** Four buttons narrow the shelf down, and a counter says how many books are showing.

![Price filter and book cards on the kids shelf](docs/images/kids-shelf.png)

The scientists' shelf has a completely different feel:

![The scientists shelf](docs/images/scientists-shelf.png)

**Choose how many copies and order.** Every book has a small + and − control, and the Add to cart button saves them to your cart (see "New in version 4").

**Get a deal by email every Friday.** The newsletter box checks that the email looks right and then says thanks.

![Newsletter with a mistake in the email](docs/images/home-newsletter-error.png)

![Newsletter after signing up](docs/images/home-newsletter-done.png)

**Ask a real person.** The contact form first asks what the visitor needs, then only shows the questions that matter for that. Someone who wants help picking a book sees different fields than someone tracking an order.

![The contact form](docs/images/contact.png)

**Use it on a phone.** The site works on small screens too, with a menu button and swipeable rows of books.

<img src="docs/images/mobile-adults.png" alt="The adults shelf on a phone" width="300">

## How the page reacts to people

The parts of the site that change when someone does something are built with two ideas from React:

- **State** is the page's memory. It remembers things like whether the menu is open, how many copies someone picked, or what they typed in the newsletter box.
- **Events** are the things people do: clicking, typing, pressing a key. Each one runs a small piece of code that updates the memory, and the page redraws itself to match.

Here's what that looks like in the real code.

**The newsletter box** remembers the email and the message to show. It updates on every keystroke and checks the email when the form is sent.

Code: `client/src/components/Newsletter.jsx`. After the check it now sends the email to the API.

**The menu** remembers whether it's open. Clicking the button flips it, and pressing Escape closes it.

Code: `client/src/components/Header.jsx`.

**Each book card** remembers its own number of copies, so changing one book never changes another.

Code: `client/src/components/BookCard.jsx`.

**The shelf** remembers which price filter is chosen and works out which books to show from that.

Code: `client/src/components/Shelf.jsx`. The chosen filter and the search text are now sent to the server, which returns the matching books.

**The page switcher** reads the address (like `#/kids`) and tells the site which shelf to show, with no extra library.

Code: `client/src/lib/useRoute.js`.

## Where things are on the page

**Home page, top to bottom:** header, opening banner, "Who are you shopping for?" tiles, scrolling book covers, the four promises, book of the month, a short video, the newsletter, the contact form and the footer. The floating "Chat" button stays in the bottom-right corner.

**Each reader page:** header, that group's banner, three short promises, the price filter and book grid, links to the other shelves, then the contact form and footer.

## New in version 4: a real backend

The site now has a server and a database behind it. What that changed for visitors:

- **Create an account and sign in.** The header shows "Sign in" or "My account / Sign out". You stay signed in after a refresh.
- **A real cart and checkout.** "Add to cart" replaces the old order-by-email link. The cart is saved in the database, checkout turns it into an order and lowers the stock.
- **A wishlist.** The heart on every book saves it to your account.
- **My account page** (`#/account`) with your wishlist and your order history.
- **Search** on every shelf, next to the price filter. Both are answered by the server.
- **Newsletter and contact form** now save to the database instead of doing nothing / opening an email app.
- **Stock.** "Only 3 left" and "Sold out" labels; you can't buy more than exist.

The books themselves now come from the database too (one seed script copies the old hardcoded list into it).

**Step-by-step manual for VS Code: [docs/MANUAL.md](docs/MANUAL.md).**

**Full explanation (folder structure, database tables in plain English, how login works, API list, deployment steps): [docs/BACKEND.md](docs/BACKEND.md).**

## Project layout

```
client/   the React + Tailwind website (what you see in the browser)
server/   the Express API, the database schema and the seed script
docs/     screenshots + BACKEND.md (the explanation)
```

## Try it yourself

You need Node.js 20+ and a free Postgres database (for example [Neon](https://neon.tech)).

```bash
# 1. the server
cd server
npm install
npm run setup               # asks for your Neon string, writes .env, creates tables + books
npm run dev                 # API on http://localhost:4000

# 2. the website (second terminal)
cd client
npm install
npm run dev                 # open http://localhost:5173
```

## Good to know

- `.env` files are never committed (see `.gitignore`). `server/.env.example` shows which values you need.
- The shop is a demo: checkout saves an order but takes no payment.
- The email address and phone number in the contact section are placeholders.
- To add a book: add an entry in `server/seed/catalog.js`, a cover picture with the same id in `client/public/assets/covers`, then run `npm run db:seed` again.
