(function() {

  var hamburger = document.getElementById('nav-icon3')
  var navWrapper = document.querySelectorAll('.navigation-wrapper')[0]

  var navHome = document.getElementById('nav-home')
  var navCollection = document.getElementById('nav-collection')
  var navCampaign = document.getElementById('nav-campaign')
  var navAbout = document.getElementById('nav-about')
  var navCredits = document.getElementById('nav-credits')
  var navItems = document.getElementsByClassName('nav-item')

  var collectionWrapper = document.querySelectorAll('.gallery')[0]
  collectionWrapper.style.display = 'none'
  var campgainWrapper = document.querySelectorAll('.gallery')[1]
  campgainWrapper.style.display = 'none'
  var aboutWrapper = document.querySelectorAll('.about')[0]
  aboutWrapper.style.display = 'none'
  var creditsWrapper = document.querySelectorAll('.credits')[0]
  creditsWrapper.style.display = 'none'

  var wrappers = {
    'nav-collection': collectionWrapper,
    'nav-campaign': campgainWrapper,
    'nav-about': aboutWrapper,
    'nav-credits': creditsWrapper
  }

  for(var i=0; i<navItems.length; i++) {
    navItems[i].addEventListener('click', function () {
      for (var wrapper in wrappers) {
        if (wrappers.hasOwnProperty(wrapper)) wrappers[wrapper].style.display = 'none'
      }
      toggleNavigation()
      if (this.id === 'nav-home') return
      wrappers[this.id].style.display = 'block'
    })
  }

  //  navCollection.addEventListener('click', function(e) {
  //    toggleDiv(collectionWrapper)
  //  })
  //
  //  navCampaign.addEventListener('click', function(e) {
  //    toggleDiv(campgainWrapper)
  //  })

  hamburger.addEventListener('click', function(e) {
    toggleNavigation()
  })

  function toggleNavigation() {
    if (hamburger.classList.contains('open') === true) {
      hamburger.classList.remove('open')
      navWrapper.style.display = 'none'
    } else {
      //collectionWrapper.style.display = 'none'
      //campgainWrapper.style.display = 'none'
      aboutWrapper.style.display = 'none'
      creditsWrapper.style.display = 'none'
      hamburger.classList.add('open')
      navWrapper.style.display = 'block'
    }
  }

  function toggleDiv(div) {
    if (div.style.display === 'none') {
      toggleNavigation()
      div.style.display = 'block'
    } else {
      div.style.display = 'none'
      toggleNavigation()
    }
  }

})();
