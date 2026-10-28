# Running the Tantush shop — owner's guide

Admin address: **https://api.tantush.xyz/app** (works on phone and computer).

---

## Daily: new website orders

1. **Orders** → newest first. Every website order is *Cash on delivery*.
2. Call the customer on the phone number in the order to confirm (the website tells them you will).
3. Pack the order → open the order → **Fulfill items** (stock is deducted) → **Mark as shipped**
   and type the courier's tracking number.
4. When the courier pays you, open the order → **Payment** → **Mark as paid**.
5. Customer cancelled or unreachable? **Cancel order** — the stock goes back automatically.

New-order alerts also appear in the admin's notification bell (and by SMS/email once a provider is connected).

## In the showroom: recording a walk-in sale (POS)

1. Open **Showroom POS** in the left menu.
2. Scan the barcode (the SKU, e.g. `TNT-NKB-40`) or type the panjabi name.
3. Click the size(s) to add them; use **+ / −** for quantity.
4. (Optional) type cash received to see the change, customer name and mobile.
5. **Record cash sale**.

The sale is saved as a completed order on the *Tantush Showroom* channel and the stock goes down
**immediately on the website too** — so nobody can order online a piece you just sold in the shop.

> Tip: print SKU barcodes (any free barcode generator, Code-128) and stick them on the tags.

## Adding a new panjabi

1. **Products → Create**.
2. Title, description, **Material** (fabric). Upload photos (first photo = main photo; the second shows on hover).
3. **Options**: add `Size` with values `38, 40, 42, 44, 46`.
4. **Variants**: set the price in **BDT** for each size; turn on *Manage inventory*.
5. **Sales channels**: tick both **Tantush Online** and **Tantush Showroom**.
6. **Organize**: choose the category and collection.
7. Publish.
8. **Stock**: Inventory → each size → *Tantush Flagship Showroom* → enter quantity.
9. **Bangla**: open the product → **Translations** → *Bengali (Bangladesh)* → enter the Bangla title,
   subtitle, description and material. Bangla visitors see this automatically.

## Discounts

* **Sale price on specific panjabis**: *Pricing → Price lists → Create* (type **Sale**), add products and the sale price.
  The website shows the old price crossed out and a “−X%” badge.
* **Promo code** (e.g. `EID20`): *Promotions → Create* → percentage or fixed amount → code.
  Customers enter it in the bag.

## Stock

* Every morning at 9:00 a **low stock** notice lists sizes with 3 or fewer pieces left.
* Restock: *Inventory* → item → adjust quantity.
* A size with 0 stock is shown crossed out on the website and can't be ordered.

## Changing shop details

* **Showroom address / phone** (shown on the website): *Settings → Locations → Tantush Flagship Showroom*.
* **Delivery charges**: *Settings → Locations → Tantush Home Delivery → shipping options*.
* **Staff accounts**: *Settings → Users → Invite*. Remove staff who leave.

## If something looks wrong

* Website down? Your developer can run `docker compose ps` and `docker compose logs` on the server.
* Wrong price or stock? Fix it in the admin — the website updates within about a minute.
