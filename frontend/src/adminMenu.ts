// Movies has its own page; the others still open a placeholder until their backend routes exist.
export const ADMIN_MENU = [
  { path: "movies", title: "Manage Movies", text: "Add new movies to the catalog." },
  { path: "promotions", title: "Manage Promotions", text: "Create promo codes and email them to subscribed customers." },
  { path: "users", title: "Manage Users", text: "View customer and admin accounts, and suspend accounts." },
  { path: "showtimes", title: "Manage Showtimes", text: "Schedule movies into showrooms by date and time." },
];
