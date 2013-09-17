'use strict';

angular.module('app').
  directive('ngFocus', ['$parse', function($parse) {
    return function(scope, element, attr) {
      var fn = $parse(attr.ngFocus);
      element.bind('focus', function(event) {
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    };
  }]).
  directive('ngBlur', ['$parse', function($parse) {
    return function(scope, element, attr) {
      var fn = $parse(attr.ngBlur);
      element.bind('blur', function(event) {
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    };
  }]).
  // Adding ng-autofill-aware to a <form> forces it to emit 'input' events on a variety of events
  // typically triggered by autofills by the browser or password managers.
  directive('ngAutofillAware', ['$parse', function() {
    return function(scope, element) {
      // listen for pertinent events to trigger input on form element
      // use timeout to ensure val is populated before triggering 'input'
      // ** 'change' event fires for Chrome/Firefox
      // ** 'keydown' for Safari 6.0.1
      // ** 'propertychange' for IE
      element.bind('change keydown propertychange', function() {
        // Trigger 'input' so underlying model changes. Don't wrap in scope.$apply as the handler
        // will trigger its own $apply.
        element.find('input').triggerHandler('input');
      });
    };
  }]).
  directive('ngClickRequireAuth', ['$parse', '$api', function($parse, $api) {
    return {
      restrict: "A",
      link: function(scope, element, attr) {
        var action = $parse(attr.ngClickRequireAuth);
        element.bind('click', function(event) {
          scope.$apply(function() {
            if (scope.current_person) {
              action(scope, {$event: event});
            } else {
              // if it has an href attribute, save that as the postauth URL
              var url = element.attr('href');
              element.removeAttr('href');
              element.removeAttr('ng-href'); // don't know if this actually has to be removed. oh well.
              $api.require_signin(url);
            }
          });
        });
      }
    };
  }]).
  directive('requireTwitter', ['$twttr', function($twttr) {
    return {
      restrict: "A",
      scope: "isolate",
      link: function() { $twttr.widgets.load(); }
    };
  }]).
  directive('requireGplus', ['$gplus', function($gplus) {
    return {
      restrict: "A",
      scope: "isolate",
      link: function() { $gplus.plusone.go(); } // $gplus.widgets.load();
    };
  }]).
  directive('selectOnClick', function () {
    return {
      restrict: "A",
      link: function (scope, element) {
        element.bind('click', function() {
          element[0].select();
        });
      }
    };
  }).
  directive('fundraiserCard', function() {
    return {
      restrict: "E",
      scope: {
        fundraiser: "="
      },
      templateUrl: "pages/fundraisers/partials/homepage_card.html"
    };
  }).
  directive('projectCard', function() {
    return {
      restrict: "E",
      scope: {
        project: "="
      },
      templateUrl: "pages/trackers/partials/homepage_card.html"
    };
  }).
  directive('requireGithubAuth', ["$api", "$window", "$location", function($api, $window, $location) {
    // TODO support more than 1 scope
    return {
      restrict: "A",
      link: function(scope, element, attr) {
        element.bind('click', function() {
          scope.$apply(function() {
            if (scope.current_person) {
              $api.set_post_auth_url($location.path());
              var permission = attr.requireGithubAuth;

              if (scope.current_person.github_account) {
                if (permission && scope.current_person.github_account.permissions && scope.current_person.github_account.permissions.indexOf(permission) < 0) {
                  // need to redirect to get dat permission
                  $window.location = $api.signin_url_for('github', { scope: [permission] });
                }
              } else {
                $window.location = $api.signin_url_for('github', { scope: [permission] });
              }
            } else {
              $api.require_signin();
            }
          });
        });
      }
    };
  }]).
  directive('targetBlank', function() {
    return {
      restrict: "E",
      link: function($scope, element) {
        var modelName = element.attr('model');
        $scope.$watch(modelName, function(model) {
          if (model !== null) {
            setTimeout(function() {
              element.find('a').attr('target', '_blank');
            }, 0);
          }
        });
      }
    };
  }).
  directive('integerOnly', function() {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          if (/^\-?\d*$/.test(viewValue)) {
            // it is valid
            ctrl.$setValidity('integer', true);
            return viewValue;
          } else {
            // it is invalid, return undefined (no model update)
            ctrl.$setValidity('integer', false);
            return undefined;
          }
        });
      }
    };
  }).
  directive('favicon', function() {
    return {
      restrict: "E",
      replace: true,
      scope: {
        domain: "@"
      },
      template: '<img ng-src="https://www.google.com/s2/favicons?domain={{domain}}" />'
    };
  }).
  directive('ownerProfileLink', function() {
    // Looks at a model and provides a link to its owner's profile.
    // Polymorphic on model.owner_type
    return {
      restrict: "E",
      transclude: true,
      replace: true,
      scope: {
        model: "="
      },
      template: '<a ng-transclude></a>',
      link: function(scope, element) {
        scope.$watch("model", function(model) {
          try {
            if (model) {
              if (!model.owner_type) {
                throw("Model is missing owner_type attribute");
              } else if (!model.person) {
                throw("Model is missing person");
              } else if (model.owner_type === "Person") {
                element.attr("href", "/people/"+model.person.slug);
              } else if (model.owner_type === "Team") {
                element.attr("href", "/teams/"+model.person.slug);
              } else {
                throw("Unexpected owner_type:", model.owner_type);
              }
            }
          } catch(e) {
            console.log("ownerProfileLink: ", e);
          }
        });
      }
    };
  }).
  directive('inputSlug', ['$filter', function($filter) {
    return {
      restrict: "AC",
      require: "ngModel",
      link: function(scope, element, attr, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          var slugifiedViewValue = $filter('slug')(viewValue);
          if (viewValue !== slugifiedViewValue) {
            ctrl.$setViewValue(slugifiedViewValue);
            ctrl.$render();
          }
        });
      }
    };
  }]);
