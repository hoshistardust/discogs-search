<template>
  <div class="page-root">
    <!-- Black Header - Full Browser Width -->
    <div class="header-bar">
      <div class="header-content">
        <router-link to="/" class="logo-wrapper">
          <!-- Discogs Logo - Place your discogs.svg in public/images/ -->
          <img
            src="/images/discogs.svg"
            alt="Discogs"
            class="discogs-logo"
            @error="handleLogoError"
          />
        </router-link>
      </div>
    </div>

    <!-- Router View -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  setup() {
    const handleLogoError = () => {
      console.warn('Logo file not found at /images/discogs.svg. Please upload your logo to public/images/discogs.svg')
    }

    return {
      handleLogoError
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inria+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap');

/* Root Container */
.page-root {
  background: #ffffff;
  width: 100%;
  min-height: 100vh;
  font-family: 'Inria Sans', sans-serif;
}

/* Header - Full Browser Width */
.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: #000000;
  height: 70px;
  width: 100%;
  z-index: 100;
}

.header-content {
  position: relative;
  width: 95%;
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
}

.logo-wrapper {
  position: absolute;
  height: 47px;
  left: 0;
  top: 12px;
  width: 129px;
  display: block;
  text-decoration: none;
}

.discogs-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Tablet Responsiveness */
@media (max-width: 1024px) {
  .header-content {
    width: 90%;
    padding: 0 20px;
  }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .header-bar {
    height: 60px;
  }

  .header-content {
    width: 95%;
    padding: 0 10px;
  }

  .logo-wrapper {
    left: 0;
    width: 100px;
    height: 35px;
    top: 12px;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .header-content {
    padding: 0 5px;
  }

  .logo-wrapper {
    width: 80px;
    height: 28px;
  }
}
</style>
