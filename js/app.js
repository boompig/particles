var app = angular.module("App", ['ngRoute', 'ngAnimate'])
.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    "use strict";

    $routeProvider.when("/~dbkats/Particles", {
        templateUrl: "views/particles.html",
        controller: "ParticleCtrl",
        controllerAs: "p"
    })
    .when("/~dbkats/", {
        templateUrl: "views/achievements_carousel.html",
        controller: "CarouselCtrl",
        controllerAs: "c"
    }).when("/", {
        // also main view
        templateUrl: "views/achievements_carousel.html",
        controller: "CarouselCtrl",
        controllerAs: "c"
    });

    $locationProvider.html5Mode(true);
}])
.controller("MainCtrl", ['$route', '$routeParams', '$location', function ($route, $routeParams, $location) {
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
}])
.controller("CarouselCtrl", ['$routeParams', function ($routeParams) {
    /* the starting index in the carousel */
    this.carouselIndex = 0;

    /* # of elements in the carousel */
    this.maxIndex = 3;

    this.nextIndex = function () {
        this.carouselIndex = (this.carouselIndex + 1) % this.maxIndex;
        console.log(this.carouselIndex);
    };

    this.prevIndex = function () {
        this.carouselIndex = (this.carouselIndex + this.maxIndex - 1) % this.maxIndex;
    };

    /* whether to hide the carousel view */
    this.hideView = false;

    this.name = "carouselController";
    this.params = $routeParams;
}])
.controller("ParticleCtrl", ['$routeParams', function ($routeParams) {
    "use strict";

    this.name = "particleController";
    this.params = $routeParams;
}]);
