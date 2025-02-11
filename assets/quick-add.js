var Shopify = Shopify || {};
// ---------------------------------------------------------------------------
// Money format handler
// ---------------------------------------------------------------------------
Shopify.money_format = "${{amount}}";
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

function updateData() {
  document
    .querySelectorAll(
      "quick-add-modal .qty-btn-plus, quick-add-modal .qty-btn-minus"
    )
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        const qtyInput = button
          .closest(".variant-qty-box")
          .querySelector(".input-qty");
        let currentValue = parseInt(qtyInput.value, 10) || 0;
        let updatedQty = currentValue;
        if (button.classList.contains("qty-btn-plus")) {
          qtyInput.value = currentValue + 1;
          updatedQty = currentValue + 1;
        } else if (button.classList.contains("qty-btn-minus")) {
          if (currentValue > 0) {
            qtyInput.value = currentValue - 1;
            updatedQty = currentValue - 1;
          }
        }

        let dataPrice = button.dataset.price;

        if (dataPrice) {
          let closestTr = button.closest("tr");
          if (closestTr) {
            let variantTotal = closestTr.querySelector(".variant-total");
            if (variantTotal) {
              let variantTotalPrice = Number(dataPrice) * Number(updatedQty);
              let discountData = window.discount_calculation;
              if (discountData) {
                let rules = discountData[0];
                let ruleArray = rules?.split("\n");
                let discountArr = ruleArray?.map((rule) => {
                  let [range, discount] = rule.split("=");
                  let qty = parseInt(range.split("-")[0], 10);
                  discount = parseInt(discount, 10);
                  return { qty, discount };
                });

                let foundObj = discountArr?.reduce(
                  (prev, current) => {
                    return current.qty <= updatedQty && current.qty > prev.qty
                      ? current
                      : prev;
                  },
                  { qty: -Infinity }
                );

                let discount = foundObj?.discount;
                if (Number(discount) > 0) {
                  variantTotalPrice =
                    variantTotalPrice - variantTotalPrice * (discount / 100);
                }
                let variantDiscount =
                  closestTr.querySelector(".variant-discount");
                if (variantDiscount) {
                  variantDiscount.innerHTML = `${discount}%`;
                }
              }

              closestTr
                .querySelectorAll("[data-total-price]")
                .forEach(function (element) {
                  element.setAttribute("data-total-price", variantTotalPrice);
                });

              variantTotal.innerHTML = Shopify.formatMoney(
                variantTotalPrice,
                "${{amount}}"
              );

              let quickViewVariantTable = button.closest(
                ".quick-view-variant-table"
              );
              if (quickViewVariantTable) {
                let totalQty = 0;
                quickViewVariantTable
                  .querySelectorAll("[name='qty']")
                  .forEach(function (element) {
                    totalQty += Number(element.value);
                  });

                let productInfo = quickViewVariantTable.closest("product-info");
                if (productInfo) {
                  let totalItemCount =
                    productInfo.querySelector(".total-item-count");
                  if (totalItemCount) {
                    totalItemCount.innerHTML = totalQty;
                  }

                  let submitBtn = productInfo.querySelector("[type='submit']");
                  if (Number(totalQty) > 0) {
                    if (submitBtn && submitBtn.hasAttribute("disabled"))
                      submitBtn.removeAttribute("disabled");
                  } else {
                    if (submitBtn && !submitBtn.hasAttribute("disabled"))
                      submitBtn.setAttribute("disabled", "disabled");
                  }
                  let totalPrice = 0;
                  quickViewVariantTable
                    .querySelectorAll("[data-total-price]")
                    .forEach(function (element) {
                      totalPrice += Number(element.dataset.totalPrice);
                    });
                let totalItemPrices = productInfo.querySelectorAll(".total-item-price");
                  
                  totalItemPrices.forEach(totalItemPrice => {
                    if (totalPrice == 0 || totalPrice == undefined || totalPrice == null) {
                      totalItemPrice.innerHTML = `$0.00`;
                    } else {
                      totalItemPrice.innerHTML = Shopify.formatMoney(totalPrice, "${{amount}}");
                    }
                  });

                }
              }
            }
          }
        }
      });
    });
}

if (!customElements.get("quick-add-modal")) {
  customElements.define(
    "quick-add-modal",
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
      }

      hide(preventFocus = false) {
        const cartNotification =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = "";

        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        opener.setAttribute("aria-disabled", true);
        opener.classList.add("loading");
        opener.querySelector(".loading__spinner").classList.remove("hidden");

        let url = `${opener.getAttribute(
          "data-product-url"
        )}?view=quick-drawer`;
        // fetch(opener.getAttribute('data-product-url'))
        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            this.productElement = responseHTML.querySelector(
              'section[id^="MainProduct-"]'
            );
            this.productElement.classList.forEach((classApplied) => {
              if (
                classApplied.startsWith("color-") ||
                classApplied === "gradient"
              )
                this.modalContent.classList.add(classApplied);
            });
            this.preventDuplicatedIDs();
            this.removeDOMElements();
            this.setInnerHTML(this.modalContent, this.productElement.innerHTML);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }

            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            this.removeGalleryListSemantic();
            this.updateImageSizes();
            this.preventVariantURLSwitching();
            super.show(opener);
            updateData();
          })
          .finally(() => {
            opener.removeAttribute("aria-disabled");
            opener.classList.remove("loading");
            opener.querySelector(".loading__spinner").classList.add("hidden");
          });
      }

      setInnerHTML(element, html) {
        element.innerHTML = html;

        // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
        element.querySelectorAll("script").forEach((oldScriptTag) => {
          const newScriptTag = document.createElement("script");
          Array.from(oldScriptTag.attributes).forEach((attribute) => {
            newScriptTag.setAttribute(attribute.name, attribute.value);
          });
          newScriptTag.appendChild(
            document.createTextNode(oldScriptTag.innerHTML)
          );
          oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
      }

      preventVariantURLSwitching() {
        const variantPicker =
          this.modalContent.querySelector("variant-selects");
        if (!variantPicker) return;

        variantPicker.setAttribute("data-update-url", "false");
      }

      removeDOMElements() {
        const pickupAvailability = this.productElement.querySelector(
          "pickup-availability"
        );
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = this.productElement.querySelector("product-modal");
        if (productModal) productModal.remove();

        const modalDialog =
          this.productElement.querySelectorAll("modal-dialog");
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs() {
        const sectionId = this.productElement.dataset.section;
        this.productElement.innerHTML =
          this.productElement.innerHTML.replaceAll(
            sectionId,
            `quickadd-${sectionId}`
          );
        this.productElement
          .querySelectorAll("variant-selects, product-info")
          .forEach((element) => {
            element.dataset.originalSection = sectionId;
          });
      }

      removeGalleryListSemantic() {
        const galleryList = this.modalContent.querySelector(
          '[id^="Slider-Gallery"]'
        );
        if (!galleryList) return;

        galleryList.setAttribute("role", "presentation");
        galleryList
          .querySelectorAll('[id^="Slide-"]')
          .forEach((li) => li.setAttribute("role", "presentation"));
      }

      updateImageSizes() {
        const product = this.modalContent.querySelector(".product");
        const desktopColumns = product.classList.contains("product--columns");
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll(".product__media img");
        if (!mediaImages.length) return;

        let mediaImageSizes =
          "(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)";

        if (product.classList.contains("product--medium")) {
          mediaImageSizes = mediaImageSizes.replace("715px", "605px");
        } else if (product.classList.contains("product--small")) {
          mediaImageSizes = mediaImageSizes.replace("715px", "495px");
        }

        mediaImages.forEach((img) =>
          img.setAttribute("sizes", mediaImageSizes)
        );
      }
    }
  );
}
