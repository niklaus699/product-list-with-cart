document.addEventListener("DOMContentLoaded", function () {
  let cartItems = [];

  fetch("data.json")
    .then((response) => response.json())
    .then((data) => displayDesserts(data))
    .catch((error) => console.error("Error loading JSON:", error));

  function displayDesserts(dessertsData) {
    const container = document.getElementById("dessertContainer");

    dessertsData.forEach((dessert, index) => {
      // Added index parameter
      const dessertCard = document.createElement("div");
      dessertCard.classList.add("dessert-card");
      dessertCard.dataset.quantity = "0";
      // dessertCard.dataset.image
      dessertCard.dataset.id = index; // Now properly using index
      // In displayDesserts function
      dessertCard.dataset.thumbnail = dessert.image.thumbnail; // Add this line

      dessertCard.innerHTML = `
          <img src="${dessert.image.desktop}" alt="${
        dessert.name
      }" class="dessert-image">
          <button class="add-to-cart-btn">
            <img src="./assets/images/icon-add-to-cart.svg" class="cart-icon">
            <span class="add-btn-text">Add to Cart</span>
          </button>
          <div class="dessert-info-div">
            <p>${dessert.category}</p>
            <span class="dessert-name">${dessert.name}</span>
            <span class="dessert-price">$${dessert.price.toFixed(2)}</span>
          </div>
        `;

      container.appendChild(dessertCard);
    });

    // Rest of the event handling and cart logic
    container.addEventListener("click", (e) => {
      const addToCartBtn = e.target.closest(".add-to-cart-btn");
      const plusBtn = e.target.closest(".plus-btn");
      const minusBtn = e.target.closest(".minus-btn");

      if (addToCartBtn && !addToCartBtn.classList.contains("active")) {
        const dessertCard = addToCartBtn.closest(".dessert-card");
        activateQuantityControls(addToCartBtn, dessertCard);
      }

      if (plusBtn || minusBtn) {
        const dessertCard = (plusBtn || minusBtn).closest(".dessert-card");
        const quantitySpan = dessertCard.querySelector(".quantity");
        let quantity = parseInt(dessertCard.dataset.quantity);
        const price = parseFloat(
          dessertCard
            .querySelector(".dessert-price")
            .textContent.replace("$", "")
        );
        const name = dessertCard.querySelector(".dessert-name").textContent;

        if (plusBtn) quantity++;
        if (minusBtn && quantity > 0) quantity--;

        dessertCard.dataset.quantity = quantity;
        quantitySpan.textContent = quantity;

        updateCart({
          name: name,
          price: price,
          quantity: quantity,
          id: dessertCard.dataset.id,
          thumbnail: dessertCard.dataset.thumbnail, // Use the thumbnail path
        });

        if (quantity === 0) revertAddToCartButton(dessertCard);

        toggleCart();
      }
    });
  }
  function activateQuantityControls(button, parentCard) {
    const originalContent = button.innerHTML;
    button.classList.add("active");
    button.innerHTML = `
            <button class="minus-btn"><img src="./assets/images/icon-decrement-quantity.svg"></button>
            <span class="quantity">${parentCard.dataset.quantity}</span>
            <button class="plus-btn"><img src="./assets/images/icon-increment-quantity.svg"></button>
          `;

    // Store original content in parent for potential revert
    parentCard.dataset.originalContent = originalContent;
    parentCard
      .querySelector(".dessert-image")
      .classList.add("desert-image-focus");
  }

  // Add these new functions for cart management
  function updateCart(item) {
    // Remove item if quantity is 0
    if (item.quantity === 0) {
      cartItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
      return;
    }

    // Update existing item or add new
    const existingIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === item.id
    );
    if (existingIndex > -1) {
      cartItems[existingIndex] = item;
    } else {
      cartItems.push(item);
    }
  }

  function calculateTotals() {
    return cartItems.reduce(
      (acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalCost += item.quantity * item.price;
        return acc;
      },
      { totalQuantity: 0, totalCost: 0 }
    );
  }

  function toggleCart() {
    const cart = document.querySelector(".cart");
    const emptyHTML = ` <aside class="cart">
        <h2>Your cart(0)</h2>
        <img src="./assets/images/illustration-empty-cart.svg" alt="" class="empty-cart-image"/>
        <p class="empty-text">Your added items will appear here</p>
      </aside>`;
    const totals = calculateTotals();
    const cartHTML = `
        <h2>Your Cart (${totals.totalQuantity})</h2>
        <div class="cart-items-container">
          ${cartItems
            .map(
              (item) => `
            <div class="cart-item">
              <div class="purchase-info">
                <h3>${item.name}</h3>
                <div class="price-info">
                  <span class="count">${item.quantity}x</span>
                  <span class="item-price">@ $${item.price.toFixed(2)}</span>
                  <span class="item-amount">$${(
                    item.quantity * item.price
                  ).toFixed(2)}</span>
                </div>
              </div>
              <button class="close-cart" data-id="${item.id}">
                <img src="./assets/images/icon-remove-item.svg" alt="Close Cart">
              </button>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="cart-total">
          <h4>Order Total</h4>
          <span>$${totals.totalCost.toFixed(2)}</span>
        </div>
        <div class="delivery-message"> 
          <img src="./assets/images/icon-carbon-neutral.svg"/>
          <h5> This is a <span class="inner-delivery-text"> carbon-neutral </span> delivery</h5>
        </div>
        <button id="confirmOrderBtn"><span>Confirm Order</span></button>
      `;

    cart.innerHTML = cartHTML;
    cart.classList.add("cart-filled", cartItems.length > 0);
    if (cartItems.length < 1) {
      cart.classList.remove("cart-filled");
      cart.innerHTML = emptyHTML;
    }
    // Add event listener for confirm order button
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");
    // Ensure the button is present before adding the event listener
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener("click", showConfirmationModal);
    }

    // Add event listener for remove buttons
    cart.querySelectorAll(".close-cart").forEach((button) => {
      button.addEventListener("click", (e) => {
        const itemId = e.currentTarget.dataset.id;
        console.log(itemId);

        // 1. Remove from cart
        cartItems = cartItems.filter((item) => item.id !== itemId);

        // 2. Find corresponding dessert card
        const dessertCard = document.querySelector(
          `.dessert-card[data-id="${itemId}"]`
        );
        if (dessertCard) {
          // 3. Reset quantity to 0
          dessertCard.dataset.quantity = "0";

          // 4. Revert the add-to-cart button if active
          const addToCartBtn = dessertCard.querySelector(".add-to-cart-btn");
          if (addToCartBtn.classList.contains("active")) {
            revertAddToCartButton(dessertCard);
          }

          // 5. Update any existing quantity display
          const quantitySpan = dessertCard.querySelector(".quantity");
          if (quantitySpan) {
            quantitySpan.textContent = "0";
          }
        }
        toggleCart();
      });
    });
  }
  function revertAddToCartButton(parentCard) {
    const addToCartBtn = parentCard.querySelector(".add-to-cart-btn");
    addToCartBtn.classList.remove("active");
    addToCartBtn.innerHTML = parentCard.dataset.originalContent;
    parentCard
      .querySelector(".dessert-image")
      .classList.remove("desert-image-focus");
  }

  function showConfirmationModal() {
    const modalBackdrop = document.getElementById("modalBackdrop");
    const confirmationModal = document.getElementById("confirmationModal");
    // Set total
    const totals = calculateTotals();
    confirmationModal.innerHTML = `
      <div class="modal-header">
        <h1>Order Confirmed! 🎉</h1>
        <h3>We hope you enjoy your food!</h3>
      </div>
      
      <div class="confirmed-items">
        ${cartItems
          .map(
            (item) => `
          <div class="confirmed-item">
            <div class="confirmed-content">
              <img src="${
                item.thumbnail
              }" class="confirmation-thumbnail" alt="${item.name}">
              <div>
                <span class="confirmed-name">${item.name}</span>
                <div class="price-contents">
                  <span class="count">${item.quantity}x</span>
                  <span class="item-price">@ $${item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <span class="item-amount">$${(item.quantity * item.price).toFixed(
              2
            )}</span>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="modal-footer">
        <div class="confirmed-total">
          <span>Order Total</span>
          <span id="confirmedTotal">$${totals.totalCost.toFixed(2)}</span>
        </div>
        <button id="startNewOrderBtn" class="start-new-order-btn">Start New Order</button>
      </div>
    `;

    const newOrderBtn = confirmationModal.querySelector("#startNewOrderBtn");
    newOrderBtn.addEventListener("click", resetOrder);

    // Show modal
    modalBackdrop.style.display = "block";
    confirmationModal.style.display = "flex";
    confirmationModal.style.flexDirection= "column";
  }

  function resetOrder() {
    cartItems = [];
    document.querySelectorAll(".dessert-card").forEach((card) => {
      card.dataset.quantity = "0";
      const addToCartBtn = card.querySelector(".add-to-cart-btn");
      if (addToCartBtn.classList.contains("active")) {
        revertAddToCartButton(card);
      }
    });
    toggleCart();
    closeConfirmationModal();
  }

  function closeConfirmationModal() {
    document.getElementById("modalBackdrop").style.display = "none";
    document.getElementById("confirmationModal").style.display = "none";
  }
});
