/*
 * The main controller / thing for the email page
 *
 * ... by Jon Roig (jroig@godaddy.com)
 *
 */


var WCC = WCC || {};

WCC.email = (function(){

    // internal vars 'n' whatnot
    var accountCountObj = {};


    // stuff for the "View By" area
    var expandedMenu = null;
    var loaded = false;
    var fullDataRowArray = [];
    var dataHuntArray = [];
    var currentlyResizingUsername = false;

    var whichGripper = null;

    var currentlyGettingAccounts = null;

    var tooWideCount = 0;

    var resizeSetup = false;
    var planLoadingArray = [];
    var gettingAlerts = false;

    // PRIVATE METHODS

    /**
     * AJAX success for getting counts
     *
     * @param object data incoming data
     */
    var getAccountCountSuccess = function (data)
    {
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {
            accountCountObj = data;
            $(document).trigger('accountCountUpdate');
        }

        return true;
    };


    /**
     * AJAX success for getting other data
     *
     * @param object data
     */
    var getOtherDataSuccess = function (data)
    {
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {
            for (var k in data)
            {
                WCC.cache.setAttribute(data['emailUser'], k, data[k]);
            }

            var infoData = WCC.cache.getByKey(data['emailUser']);
            var flyout = $("#flyoutArea");
            flyout.empty();

            var renderedOutput = this.renderFlyout(infoData);
            flyout.html(renderedOutput);
        }

        return true;
    };

    var getTheRestOfTheEmailsSuccess = function (data)
    {

      konsole.markTime('rendering','getTheRestOfTheEmailsSuccess');
      var dataCheck = WCC.utils.checkData(data);
      if (dataCheck == true)
      {
        var packIdArray = [];

        // populate the cache
        for (var k in data)
        {
          if (data[k]['emailAddress'] != undefined)
          {
            WCC.cache.cacheThing(k, data[k]);
            packIdArray[ data[k]['pack_id']] = '1';
          }
        }
      }

      var shouldRefresh = false;
      var planOpenArray = WCC.email.returnOpenPlansOnCurrentPage();
      for (var x in planOpenArray)
      {
        if (packIdArray[planOpenArray[x]['pack_id']] != undefined && planOpen == true)
        {
          shouldRefresh = true;
        }
      }

      // now we know what plans are open... let's trigger a refresh then do some other quick stuff
      if (shouldRefresh == true)
      {
        WCC.email.renderAccountRows();
      }

      $(document).trigger('filterRefresh');
      planLoadingArray = [];


      this.getEmailQuotas();

    }



    var getAllAccountsForPlanViewFirstPageSuccess = function (data)
    {
      WCC.cache.reset();

      var alreadyLoadedArray = [];

      var dataCheck = WCC.utils.checkData(data);
      if (dataCheck == true)
      {
          // filter anything without an email address
          for (var k in data)
          {
            if (data[k]['emailAddress'] != undefined)
            {
              WCC.cache.cacheThing(k, data[k]);
              alreadyLoadedArray[alreadyLoadedArray.length] = data[k]['emailAddress'];
            }
          }
      }


      // figure out what plans remain...
      var outputPlanLoadingArray = [];
      var planArray = WCC.model.emailPlans.get();
      for (var k in planArray)
      {
        if (jQuery.inArray(planArray[k]['pack_id'], planLoadingArray) == -1)
        {
          outputPlanLoadingArray[outputPlanLoadingArray.length] = planArray[k]['pack_id'];
        }
      }
      planLoadingArray = outputPlanLoadingArray;

      konsole.markTime('rendering', 'getAllAccountsForPlanViewFirstPageSuccess');

      // we're gonna trigger a refresh, grab more of those sweet, sweet quotas
      //$(document).trigger('infoRowRefresh');

      WCC.email.renderAccountRowsAction();
      $(document).trigger('filterRefresh');

      konsole.markTime('rendering','gettherestofthemails');

      // now we're going to get the rest of the email addresses
      var that = this;
      $.ajax({
          type: "POST",
          url: 'ajaxemail/gettherestofthemails/',
          dataType : 'json',
          data: {'postToken':Globals.POST_TOKEN, 'alreadyLoadedArray':alreadyLoadedArray},
          success :  function(data) {getTheRestOfTheEmailsSuccess.call(that, data);},
          error :  WCC.utils.handleError
      });

      // let's review the open plans and extract any email addresses in them
      // we'll make 'em a priority... up to 250
      var planOpenArray = WCC.email.returnOpenPlansOnCurrentPage();
      var priorityEmailAddressArray = [];
      var tmpObj = {};
      var cacheObj = WCC.cache.returnCacheObject();
      for (var k in cacheObj)
      {
        if ($.inArray(cacheObj[k]['pack_id'], planOpenArray) !== -1 && priorityEmailAddressArray.length < 250)
        {
          if (cacheObj[k]['delivery_mode'] != undefined && cacheObj[k]['delivery_mode'] == 'local')
          {
            priorityEmailAddressArray[priorityEmailAddressArray.length] = cacheObj[k]['emailAddress'];
          }
        }
        if (priorityEmailAddressArray.length > 250)
        {
          break;
        }
      }

      this.getEmailQuotas(priorityEmailAddressArray);

    }

    var getFirstPageOfEmailsSuccess = function(data)
    {


      var dataCheck = WCC.utils.checkData(data);
      var ignoreEmailArray = [];
      if (dataCheck == true)
      {
        // cache that stuff...
        WCC.cache.reset();

        // filter anything without an email address
        for (var k in data.emailAddresses)
        {
          if (data.emailAddresses[k]['emailAddress'] != undefined)
          {
            WCC.cache.cacheThing(k, data.emailAddresses[k]);
            ignoreEmailArray[ignoreEmailArray.length] = data.emailAddresses[k]['emailAddress'];
          }
        }

        currentlyGettingAccounts = false;

        WCC.email.renderAccountRowsAction();
        //$(document).trigger('infoRowRefresh');
        $(document).trigger('filterRefresh');
      }


      WCC.email.getAllAccounts(ignoreEmailArray);
      this.getEmailQuotas(ignoreEmailArray);
    }

    /**
     * AJAX success for getting all accounts
     *
     * @param object data
     */
    var getAllAccountsSuccess = function (data)
    {
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {

            // filter anything without an email address
            for (var k in data)
            {
              if (data[k]['emailAddress'] != undefined)
              {
                    WCC.cache.cacheThing(k, data[k]);
              }
            }
        }

        currentlyGettingAccounts = false;

        // we're gonna trigger a refresh, grab more of those sweet, sweet quotas
        //$(document).trigger('infoRowRefresh');
        $(document).trigger('filterRefresh');

        var cacheObj = WCC.cache.returnCacheObject();
        var fullDataRowArray = [];
        var priorityEmailAddressArray = [];
        var count = 0;
        for (var k in cacheObj)
        {
          fullDataRowArray[fullDataRowArray.length] = cacheObj[k];
          if (count < 100)
          {
            if (cacheObj[k]['delivery_mode'] != undefined && cacheObj[k]['delivery_mode'] == 'local')
            {
              priorityEmailAddressArray[priorityEmailAddressArray.length] = cacheObj[k]['emailAddress'];
            }
          }

          if (count > 100)
          {
            break;
          }

          count++;
        }

        var paginationHTML = WCC.pagination.returnPagination(fullDataRowArray);
        $("#paginationArea").html(paginationHTML);

        // grab the top 100 email addresses first...
        //this.getEmailQuotas(priorityEmailAddressArray);

        this.getEmailQuotas();
        return true;
    };

    // caching this REALLY helps with performance
    var getMatchForEmailAddress = function(emailAddress)
    {
      var cacheKey = 'getMatchForEmailAddress-'+ emailAddress;
      if (WCC.tmpObjCache.get(cacheKey) != null)
      {
          return WCC.tmpObjCache.get(cacheKey);
      }

      var cacheThing = WCC.cache.returnCacheObject();
      var cacheEmail = '';
      for (var x in cacheThing)
      {
        cacheEmail = cacheThing[x]['emailAddress'];
        WCC.tmpObjCache.set('getMatchForEmailAddress-' + cacheEmail, x, 10000);
      }

      return WCC.tmpObjCache.get(cacheKey);

    };

    /**
     * AJAX success for getting email quotas
     * ... adds the data to the regular WCC.cache
     * Trigers an infoRowRefresh when it's done...
     *
     * @param object data
     */
    var getEmailQuotasSuccess = function (data)
    {
      konsole.markTime('rendering', 'getEmailQuotasSuccess');
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {

          var cacheThing = WCC.cache.returnCacheObject();
          var emailAddressId = 0;
          var theRow = null;
          var match = -1;
          var counter = 0;
          for (var k in data['addresses'])
          {
            counter++;
              match = getMatchForEmailAddress(k);

              if (match != null)
              {
                dataHuntArray[dataHuntArray.length] = cacheThing[match]['emailAddress'];
                if (data['addresses'][k]['quota_bytes'] != undefined)
                {
                    WCC.cache.setAttribute(match, 'quota_bytes', data['addresses'][k]['quota_bytes']);
                }
                if (data['addresses'][k]['used_bytes'] != undefined)
                {
                    WCC.cache.setAttribute(match, 'used_bytes', data['addresses'][k]['used_bytes']);
                }
                if (data['addresses'][k]['relays_per_day'] != undefined)
                {
                    WCC.cache.setAttribute(match, 'relaysPerDay', data['addresses'][k]['relays_per_day']);
                }
                if (data['addresses'][k]['relays_today'] != undefined)
                {
                    WCC.cache.setAttribute(match, 'relaysToday', data['addresses'][k]['relays_today']);
                }

                // set up a percentage so we can sort that way later
                if (data['addresses'][k]['quota_bytes'] != undefined && data['addresses'][k]['used_bytes'] != undefined)
                {
                    var quotaPercentage = Math.round ((data['addresses'][k]['used_bytes'] / data['addresses'][k]['quota_bytes']) * 100);
                    if ($.isNumeric(quotaPercentage) == false)
                    {
                        quotaPercentage = -13013;
                    }
                    var quotaObj = WCC.utils.bytesToCommonReadable(data['addresses'][k]['used_bytes'], data['addresses'][k]['quota_bytes']);
                    quotaObj.raw_used_bytes = data['addresses'][k]['used_bytes'];
                    quotaObj.quota_bytes = data['addresses'][k]['quota_bytes'];

                    WCC.cache.setAttribute(match, 'quotaObj', quotaObj);
                    WCC.cache.setAttribute(match, 'quotaPercentage', quotaPercentage);
                }

                // match to en email id
                emailAddressId = cacheThing[match]['email_address_id'];

                // then see if it's around to get updates
                theRow = $('#infoTable').find('#quotaRow_' + emailAddressId);
                if (theRow.length > 0)
                {
                    renderedOutput = $.tmpl('emailInforowsQuota', cacheThing[match]);
                    theRow.html( renderedOutput );

                    theRow = $('#infoTable').find('#relayRow_' + emailAddressId);
                    renderedOutput = $.tmpl('emailInforowsRelays', cacheThing[match]);
                    theRow.html( renderedOutput );
                }
              }
          }
          konsole.markTime('rendering', 'processed ' + counter + ' quotas');

          if (data['beMiserly'] != true)
          {
            this.getEmailQuotas();
          }
        }

        // refresh the set, eat more quotas. if there are any.
        //$(document).trigger('infoRowRefresh');


        return true;
    };


     /**
     * AJAX success for retying MX data
     *
     * @param object data
     */
    var retryMXSuccess = function (data)
    {
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {
             WCC.cache.removeAlert(data['retrying'], 'email', 'failmx');
             WCC.cache.addAlert(data['retrying'],'email','pendmx');
             $(document).trigger('infoRowRefresh');;
        }

        return true;
    };

    /**
     * AJAX success for sending setup instructions
     *
     * @param object data incoming data
     */
    var sendSetupInstructionsSuccess = function (data)
    {
        var dataCheck = WCC.utils.checkData(data);
        if (dataCheck == true)
        {
            WCC.utils.doGrowl('', '', 'Setup Email Sent for ' + WCC.utils.utf8Address(WCC.components.easySetup.getSetupEmailAddress()) );
        }

        return true;
    };


    return {

        /**
         * Get stuff going...
         *
         */
        init: function()
        {
        	require("starfield/sf.droplist", function() {
        	    ;
        	  });

            // cache some templates
            $.template( "emailInfoRows", $('#emailInfoRows') );
            $.template( "emailPlanViewInfoRows", $('#emailPlanViewInfoRows') );
            $.template("emailViewPlanListHeader", $('#emailViewPlanListHeader'));
            $.template('emailViewPlanHeader', $('#emailViewPlanHeader'));
            $.template('emailInfoRowsHeader', $('#emailInfoRowsHeader'));
            $.template('emailPlanViewInfoRowsHeader', $('#emailPlanViewInfoRowsHeader'));
            $.template('blankEmailInfoRows', $('#blankEmailInfoRows'));
            $.template('loadingEmailInfoRows', $('#loadingEmailInfoRows'));
            $.template('emailInforowsRelays', $('#emailInforowsRelays'));
            $.template('emailInforowsQuota', $('#emailInforowsQuota'));


            var that = this;
            $(document).bind('accountCountUpdate', function(){that.renderAccountCount();});
            $(document).bind('infoRowRefresh', function(){that.renderAccountRows();});
            $(document).bind('filterRefresh', function(){that.renderViewBy();});

            // bind stuff to the view by...
            $(document).bind('updateDomains', function(){that.renderViewBy();});
            $(document).bind('updateEmailPlans', function(){that.renderViewBy();});
            $(document).bind('updateEmailPlans', function(){that.renderAccountRows();});

            $(document).bind('showSelectedAll', function(){that.showSelectedAll();});

            $(document).bind('accountAlertRefresh', function(){that.dealWithAccountAlerts()});
            $(document).bind('pageChange', function(){WCC.tmpObjCache.remove('returnOpenPlansOnCurrentPage')});

             WCC.components.muiPod.hasFreeAccounts();

            //
            this.getAccountCount();
            $(window).resize(function(){WCC.email.handleEmailAreaWidth(700);WCC.email.setupUsernameResize();});
            $(window).resize( $.debounce(500, function(){WCC.email.handleTooWide()} ));

            $('#wccEasySetupLoadIcon').click(function(){WCC.components.easySetup.open()});
            $('#wccEasySetupLoad').click(function(){WCC.components.easySetup.open()});

            // fire up the rendering....
            WCC.email.renderAccountRows();

            // grab data according to our needs
            if (WCC.sortAndSearch.returnFilterField() == 'all_plans')
            {
              this.getAllAccountsForPlanViewFirstPage();
            }
            else
            {
              //this.getAllAccounts();
              this.getFirstPageOfEmails();
            }

        },

        dealWithAccountAlerts: function()
        {
          konsole.markTime('rendering','dealWithAccountAlerts');
          // should we update?
          // basically, we just wanna see if we need to redraw the page now that we've got all these alerts
          // and whatnot
          var alertEmailList = WCC.alerts.returnRawAlertList();
          var cacheObj = WCC.cache.returnCacheObject();

          var shouldRefresh = false;
          //
          if (WCC.sortAndSearch.returnFilterField() == 'all_plans')
          {
            var visiblePlanArray = WCC.email.returnOpenPlansOnCurrentPage();

            var match = null;
            for (var k in alertEmailList)
            {
              match = getMatchForEmailAddress(alertEmailList[k]);
              if (match != null)
              {
                if (jQuery.inArray(cacheObj[match]['pack_id'], visiblePlanArray) !== -1)
                {
                  shouldRefresh = true;
                  break;
                }
              }
            }
          }
          else
          {
            // we're just gonna look at the first page of accounts to compare, see
            // if we need to refresh the page or whatever
            var numPerPage = WCC.pagination.returnRowsPerPage();
            var counter = 0;

            for (var k in cacheObj)
            {
              if (counter < numPerPage)
              {
                if (jQuery.inArray(cacheObj[k]['emailAddress'], alertEmailList) !== -1)
                {
                  shouldRefresh = true;
                  break;
                }
              }
              else
              {
                break;
              }
              counter++;
            }
          }


            $(document).trigger('infoRowRefresh');

        },

        /**
         * Return the accountCountObj
         *
         */
        returnAccountCountObj: function()
        {
            return accountCountObj;
        },


        /**
         * Get the account count
         *
         */
        getAccountCount: function()
        {
            var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/getaccountcount/',
                dataType : 'json',
                data: {'postToken':Globals.POST_TOKEN},
                success: function(data) {getAccountCountSuccess.call(that, data);},
                error: WCC.utils.handleError
            });

            return true;
        },


        getAllAccountsForPlanViewFirstPage: function()
        {
          planLoadingArray = [];
          var planArray = WCC.model.emailPlans.get();

          if (planArray == null)
          {
            setTimeout(function(){WCC.email.getAllAccountsForPlanViewFirstPage()}, 100);
            return;
          }

          konsole.markTime('rendering', 'getAllAccountsForPlanViewFirstPage');

          // figure out what plans are open and available on the first page
          planLoadingArray = WCC.email.returnOpenPlansOnCurrentPage();

          // just the email addressses for those plans
          var that = this;
          $.ajax({
              type: "POST",
              url: 'ajaxemail/getemailaccountsandplanids/',
              dataType : 'json',
              data: {'postToken':Globals.POST_TOKEN, 'planLoadingArray':planLoadingArray},
              success :  function(data) {getAllAccountsForPlanViewFirstPageSuccess.call(that, data);},
              error :  WCC.utils.handleError
          });

          return true;

        },


        returnOpenPlansOnCurrentPage: function()
        {
          var cacheKey = 'returnOpenPlansOnCurrentPage';
          if (WCC.tmpObjCache.get(cacheKey) != null)
          {
            return WCC.tmpObjCache.get(cacheKey);
          }
          if (WCC.model.emailPlans.get() == null)
          {
            return;
          }
          var planArray = WCC.model.emailPlans.get();

          var outputArray = []
          var numEmails = Globals.usedEmails;

          // figure out what plans are open and available on the current page
          var numPlanRows = 25;
          var startItem = (WCC.pagination.returnCurrentPage() - 1) * numPlanRows;
          var endItem = WCC.pagination.returnCurrentPage() * numPlanRows;
          var dataRowArray = planArray.slice(startItem, endItem);
          for (var x in dataRowArray)
          {
            // if we've got less than 250 emails, open 'em all!
            if (WCC.userSettings.get('planOpen' + dataRowArray[x]['pack_uid']) == null && numEmails < 250)
            {
              outputArray[outputArray.length] = dataRowArray[x]['pack_id'];
            }
            // otherwise, got by the settings
            else if (WCC.userSettings.get('planOpen' + dataRowArray[x]['pack_uid']) == 'open')
            {
              outputArray[outputArray.length] = dataRowArray[x]['pack_id'];
            }
          }

          WCC.tmpObjCache.set('returnOpenPlansOnCurrentPage', outputArray, 10000);
          return outputArray;
        },

        getFirstPageOfEmails: function()
        {
          currentlyGettingAccounts = true;
          var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/getfirstpageofemailaccounts/',
                dataType : 'json',
                data: {'postToken':Globals.POST_TOKEN},
                success : function(data) {getFirstPageOfEmailsSuccess.call(that, data);},
                error :  WCC.utils.handleError
            });
        },

        /**
         * Get all the account data
         *
         */
        getAllAccounts: function(ignoreEmailArray)
        {
          if (ignoreEmailArray == undefined)
          {
            var ignoreEmailArray = [];
          }
            //currentlyGettingAccounts = true;
            dataHuntArray = [];

            var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/getemailaccounts/',
                dataType : 'json',
                data: {'postToken':Globals.POST_TOKEN, 'ignoreEmailArray': ignoreEmailArray},
                success :  function(data) {getAllAccountsSuccess.call(that, data);},
                error :  WCC.utils.handleError
            });

            return true;
        },


         /**
         * Get other data for the flyout
         *
         */
        getOtherData: function(emailUser)
        {
            var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/getotherdata/',
                data: {'emailUser': emailUser, 'postToken':Globals.POST_TOKEN},
                dataType : 'json',
                success: function(data) {getOtherDataSuccess.call(that, data);},
                error: WCC.utils.handleError
            });

            return true;
        },


        /**
         * Returns a list of unused plans
         *
         */
        returnUnusedPackArray: function()
        {
            var outputArray = [];
            var planArray = WCC.model.emailPlans.get();
            for (var k in planArray )
            {
                if (planArray[k]['used_address_count'] == 0)
                {
                    outputArray[outputArray.length] = planArray[k];
                }
            }

            return outputArray;
        },


        /**
         * Return the forwarding plans
         *
         */
        returnForwardingPackArray: function()
        {
            var outputArray = [];
            var planArray = WCC.model.emailPlans.get();
            for (var k in planArray )
            {
                if (planArray[k]['delivery_mode'] == 'forward')
                {
                    outputArray[outputArray.length] = planArray[k];
                }
            }

            return outputArray;
        },


        /**
         * Return all the plan data for a given planId
         */
        returnPlanDataFromId: function(planId)
        {
            var planArray = WCC.model.emailPlans.get();
            for (var k in planArray)
            {
                if (planArray[k].pack_id == planId)
                {
                    return planArray[k];
                }
            }

            return false;
        },


        /**
         * Get a bunch of email quotas at a time...
         * right now, it's set to grab... some number I keep changing.
         * Look below.
         *
         * For what it's worth, we keep track of the data we're currently
         * grabbing in the dataHuntArray array... removes confusion, over-getting,
         * race conditions, etc...
         */
        getEmailQuotas: function(priorityEmailAddressArray)
        {
            konsole.markTime('rendering', 'getEmailQuotas');
            var grabArray = [];
            var cacheObj = WCC.cache.returnCacheObject();
            var emailArray = [];

            var tmpObj = {};

            var grabbingEmailArray = [];

            if (priorityEmailAddressArray != undefined)
            {
              grabArray = priorityEmailAddressArray;
            }

            if (grabArray.length < 200)
            {
              for (var k in cacheObj)
              {
                if (grabArray.length < 250)
                {
                  if (cacheObj[k].delivery_mode != 'forward' && jQuery.inArray(cacheObj[k]['emailAddress'], dataHuntArray) === -1)
                  {
                    grabArray[grabArray.length] =  cacheObj[k]['emailAddress'];
                  }
                }
              }
            }

            // eventually... there will be nothing left to grab.
            if (grabArray.length == 0)
            {
              konsole.markTime('rendering', 'no more quotas');

               // with all the quotas grabbed, let's do this:
              konsole.markTime('rendering','getting alerts');
              if (gettingAlerts == false)
              {
                gettingAlerts = true;
                WCC.alerts.init('email', false);

              }


              return false;
            }

            // keep track of stuff we've gotten so we don't need to get it again...
            dataHuntArray = dataHuntArray.concat(grabArray);

/**
            // then we'll stringify it with json... send it to it's home...
            // we gotta make an array of arrays... keeps it separated
            var newArray = { 'US': [] , 'AP' : [], 'EU': []};
            var theEmailAddress = null;
            var countryCode = '';
            for (var stupid in grabArray)
            {
              theEmailAddress = grabArray[stupid]['emailAddress'];
              countryCode = grabArray[stupid]['countryCode'];
              newArray[countryCode][newArray[countryCode].length] =  theEmailAddress;
            }

            var grabString = $.toJSON(newArray);
**/

            var grabString = $.toJSON(grabArray);
            var beMiserly = false;

            if (priorityEmailAddressArray != undefined)
            {
              beMiserly = true;
            }

            var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/getemaildatabyarray/',
                dataType : 'json',
                data: {'emailAddressArray': grabString, 'postToken':Globals.POST_TOKEN, 'beMiserly': beMiserly},
                success :  function(data) {getEmailQuotasSuccess.call(that, data);},
                error :  WCC.utils.handleError
            });

            return true;
        },

        resetAlertState: function()
        {
          gettingAlerts =false;
        },

        sortByDomain: function (a,b)
        {
            aArray = a.split('@');
            bArray = b.split('@');

            if (aArray.length < 2)
            {
                return -1;
            }
            if (bArray.length < 2)
            {
                return 1;
            }

            var aDomain = aArray[1].substring(0,1).toLowerCase();
            var bDomain = bArray[1].substring(0,1).toLowerCase();

            if (aDomain < bDomain)
            {
                return 1;
            }
            if (bDomain < aDomain)
            {
                return -1;
            }

            return 0;
        },


        /**
         * Filter by account type
         *
         * @param string filterType
         */
        filterByAccountType: function(filterType)
        {
            WCC.sortAndSearch.filterByThing('accountType', filterType);
            return true;
        },


        /**
         * Set the expanded state of the menu and trigger a refresh
         */
        setExpandedMenu: function (expandedThing)
        {
            if (expandedThing == this.expandedMenu)
            {
                 this.expandedMenu = null;
            }
            else
            {
                this.expandedMenu = expandedThing;
            }

            $(document).trigger('filterRefresh');

            WCC.utils.handleUserAddressWidth();

            switch (expandedThing) {
            case 'domain':
              $("#viewByDomainsAll").click();
              break;
            case 'pack_name':
              $("#viewByPlansAll").click();
              break;
            case 'unused':
              $("#viewByUnusedAll").click();
              break;
            }

            return true;
        },


        /**
         * Returns this.expandedMenu... which menu is expanded
         */
        returnExpandedMenu: function()
        {
            return this.expandedMenu;
        },


        /**
         * Render "View By" area...
         *
         */
        renderViewBy: function()
        {
            var restoreScrollPoint = 0;
            switch(this.expandedMenu)
            {
                case 'type':
                    restoreScrollPoint = $('#viewByType').scrollTop();
                  break;
                case 'domain':
                     restoreScrollPoint = $('#viewByDomains').scrollTop();
                  break;
                case 'pack_name':
                     restoreScrollPoint = $('#viewByPlans').scrollTop();
                  break;
                case 'unused':
                     restoreScrollPoint = $('#viewByUnused').scrollTop();
                  break;
                case 'forwarding':
                     restoreScrollPoint = $('#viewByForwarding').scrollTop();
                  break;


            }

            var viewByArea = $("#viewByList");
            viewByArea.empty();

            var renderedOutput = $("#emailViewByListTemplate").tmpl();

            viewByArea.html(renderedOutput);

            if (this.expandedMenu != 'type' && WCC.sortAndSearch.returnFilterField() != 'type' )
            {
                 $('#viewByType').hide();
                 $('#viewByTypeGroup').removeClass('active');
            }
            if (this.expandedMenu != 'domain' && WCC.sortAndSearch.returnFilterField() != 'domain' )
            {
                 $('#viewByDomains').hide();
                 $('#viewByDomainsGroup').removeClass('active');
            }
            if (this.expandedMenu != 'pack_name' && WCC.sortAndSearch.returnFilterField() != 'pack_name' )
            {
                $('#viewByPlans').hide();
                $('#viewByPlansGroup').removeClass('active');
            }
            if (this.expandedMenu != 'unused' && WCC.sortAndSearch.returnFilterField() != 'unused' )
            {
                $('#viewByUnused').hide();
                $('#viewByUnusedGroup').removeClass('active');
            }
            if (this.expandedMenu != 'forwarding' && WCC.sortAndSearch.returnFilterField() != 'forwarding' )
            {
                $('#viewByForwarding').hide();
                $('#viewByForwardingGroup').removeClass('active');
            }

            if (this.expandedMenu == '' || this.expandedMenu == undefined || this.expandedMenu == null)
            {
                $('#viewByType').addClass('active');
                $('#viewByType').show();
            }

            switch(this.expandedMenu)
            {
              case 'type':
                  $('#viewByTypeGroup').addClass('active');
                        this.findScrollPoint($('#viewByType'), restoreScrollPoint);
                break;
              case 'domain':
                  $('#viewByDomainsGroup').addClass('active');
                        this.findScrollPoint($('#viewByDomains'), restoreScrollPoint);
                break;
              case 'pack_name':
                  $('#viewByPlansGroup').addClass('active');
                        this.findScrollPoint($('#viewByPlans'), restoreScrollPoint);
                break;
              case 'unused':
                  $('#viewByUnusedGroup').addClass('active');
                        this.findScrollPoint($('#viewByUnused'), restoreScrollPoint);
                break;
              case 'forwarding':
                  $('#viewByForwardingGroup').addClass('active');
                        this.findScrollPoint($('#viewByForwarding'), restoreScrollPoint);
                break;
              default:
                  $('#viewByTypeGroup').addClass('active');
            }



            //selectedThing.parent().parent().scrollTop(689)

            return true;
        },


        findScrollPoint: function (parentDiv, scrollPoint)
        {
            parentDiv.scrollTop(scrollPoint);
        },


        /**
         * Render the "Available Accounts" area
         *
         */
        renderAccountCount: function()
        {
            var accountCountArea = $("#accountCountArea");
            accountCountArea.empty();

            var renderedOutput = $("#emailAvailableAccount").tmpl(accountCountObj);

            accountCountArea.html(renderedOutput);

            //attach the generic tooltip
            WCC.utils.attachToolTip('tip');

            return true;
        },


        returnCountForDomains: function(domain)
        {

            var domainCount = 0;
            var cacheThing = WCC.cache.returnCacheObject();
            for (var k in cacheThing )
            {
                if (cacheThing[k]['domain'] == domain)
                {
                    domainCount++;
                }
            }

            return domainCount;
        },


        returnAlertsForDomain: function(domain)
        {
            var errorArray = [];
            var cacheThing = WCC.cache.returnCacheObject();
            for (var k in cacheThing )
            {
                if (cacheThing[k]['domain'] == domain)
                {
                    if (cacheThing[k]['alerts'] != undefined && cacheThing[k]['alerts']['email'] != undefined)
                    {
                        jQuery.merge( errorArray, cacheThing[k]['alerts']['email'] );
                    }
                }
            }

            return errorArray;
        },

        tackOnPlanHeader: function(infoTable)
        {

          if (WCC.sortAndSearch.returnFilterField() == 'pack_id') {
            var headerObj = this.returnPlanDataFromId(WCC.sortAndSearch.returnFilterValue());
            var mySize = {};
            mySize.maxSize = 0;
            mySize.usedSize = 0;

            $.each(WCC.cache.returnCacheObject(), function(index, thisEmail){
              if(thisEmail.pack_id == WCC.sortAndSearch.returnFilterValue() ) {
                //mySize.maxSize += (thisEmail.max_size/1024) ;
                mySize.maxSize += parseInt(thisEmail.quota_bytes);
                if(thisEmail.quotaObj ) {
                    mySize.usedSize += (parseInt(thisEmail.quotaObj.raw_used_bytes)/1024/1024);
                }
              }
            });
            headerObj.mySize = mySize;
            renderedOutput = $.tmpl('emailViewPlanHeader', headerObj);
            renderedOutput.appendTo(infoTable );
          }

        },

        getPlanSizeData: function(pack_id)
        {
          if (WCC.tmpObjCache.get('getPlanSizeData_' + pack_id) != null)
          {
            return WCC.tmpObjCache.get('getPlanSizeData_' + pack_id);
          }
            var mySize = {};
            mySize.maxSize = 0;
            mySize.usedSize = 0;

            var cacheObj = WCC.cache.returnCacheObject();
            for (var k in cacheObj)
            {
                if (cacheObj[k]['pack_id'] == pack_id)
                {
                    if (cacheObj[k]['quota_bytes'] != undefined)
                    {
                        mySize.maxSize += parseInt(cacheObj[k]['quota_bytes']);
                    }

                    if(cacheObj[k].quotaObj )
                    {
                        mySize.usedSize += (parseInt(cacheObj[k]['quotaObj']['raw_used_bytes'])/1024/1024);
                    }
                }
            }

            WCC.tmpObjCache.set('getPlanSizeData_' + pack_id, mySize, 500);
            return mySize;
        },


        /**
         * Debounced wrapper for rendering account rows
         *
         */
        renderAccountRows: function()
        {
             $.debounce(200, WCC.email.renderAccountRowsAction)();
        },


        /**
         * Render the account rows
         *
         */
        renderAccountRowsAction: function()
        {
            //WCC.tmpObjCache.remove('returnOpenPlansOnCurrentPage')
            konsole.markTime('rendering', 'ready to start');
            var that = this;
            var renderedOutput;

            var infoTable = $("#infoTable");

            var cacheObj = WCC.cache.returnCacheObject();
            var cacheObjCount = WCC.cache.returnItemCount();


            objCache = WCC.cache.sortObj(cacheObj, 'displayName', 'asc');

            var emailPlans = WCC.model.emailPlans.get();
            if (emailPlans == null && WCC.sortAndSearch.returnFilterField() == 'all_plans')
            {
              setTimeout(function(){WCC.model.emailPlans.get()}, 100);
              return;
            }

            if (currentlyGettingAccounts == true && WCC.sortAndSearch.returnFilterField() != 'all_plans')
            {
              return;
            }

            if (jQuery.isArray(emailPlans) && emailPlans.length == 0 && currentlyGettingAccounts != true)
            {
              //You go no plans, bro
                renderedOutput = $('#emailInfoRowsNoLoad').tmpl();
                infoTable.html(renderedOutput);

                renderedOutput = $("#emailNoPlanMessage").tmpl();
                $('#noAccountMessageArea').html( renderedOutput);


                 // put in some fake stuff
                infoTable.empty();
                renderedOutput = $.tmpl('emailInfoRowsHeader');

                renderedOutput.appendTo(infoTable );

                var rowClass = 'even';
                var dataRowArray = [];

                while (dataRowArray.length < 10)
                {
                    dataRowArray[dataRowArray.length] = {};
                }

                for (var k in dataRowArray)
                {
                    if (rowClass == 'even')
                    {
                        rowClass = 'odd';
                    }
                    else
                    {
                        rowClass = 'even';
                    }

                    var output = dataRowArray[k];
                    output.rowClass = rowClass;
                    renderedOutput = $.tmpl('emailInfoRows', output);
                    renderedOutput.appendTo( infoTable );
                }

                // position those badboys... and keep 'em there!
                WCC.utils.positionNoAccountsArea();
                $(window).resize(function(){WCC.utils.positionNoAccountsArea();});
                WCC.email.setupUsernameResize();
                return;
            }

            if (cacheObjCount == 0 && WCC.sortAndSearch.returnSearchTerm() != '')
            {
                if (WCC.sortAndSearch.returnFilterField() == 'all_plans' && WCC.model.emailPlans.get().length > 0)
                {

                }
                else
                {
                    //you're still loading stuff, bro
//                WCC.email.tackOnPlanHeader(infoTable);

                	renderedOutput = $("#emailNoAccountMessage").tmpl();
                    $('#noAccountMessageArea').html( renderedOutput);

                     // put in some fake stuff
                    infoTable.empty();

                    WCC.email.tackOnPlanHeader(infoTable);

                    renderedOutput = $.tmpl('emailInfoRowsHeader');
                    renderedOutput.appendTo(infoTable );

                    var rowClass = 'even';
                    var dataRowArray = [];

                    while (dataRowArray.length < 10)
                    {
                        dataRowArray[dataRowArray.length] = {};
                    }

                    for (var k in dataRowArray)
                    {
                        if (rowClass == 'even')
                        {
                            rowClass = 'odd';
                        }
                        else
                        {
                            rowClass = 'even';
                        }

                        var output = dataRowArray[k];

                        output.rowClass = rowClass;

                        renderedOutput = $.tmpl('emailInfoRows', output);

                        renderedOutput.appendTo( infoTable );
                    }

                    // position those badboys... and keep 'em there!
                    WCC.utils.positionNoAccountsArea();
                    $(window).resize(function(){WCC.utils.positionNoAccountsArea();});
                    WCC.email.setupUsernameResize();
                    return;
                }


            }
            else
            {
                $('#noAccountMessageArea').empty();
            }


            WCC.utils.hidePleaseWait();
            //$(".main-content-container").sfMsgOverlay({ message: null });
            infoTable.empty();

            // render the header
            var rowClass = 'even';
            $("#emailIndexDomainsTag").show();

            WCC.email.tackOnPlanHeader(infoTable);

            // all plans vs regular display
            $(".second-actions").show();
            if (WCC.sortAndSearch.returnFilterField() == 'all_plans' &&  WCC.sortAndSearch.returnFilterValue() == null)
            {
              //$(".second-actions").hide();
                //WCC.sortAndSearch.setSearchField('pack_name');
                //renderedOutput = $("#emailPlanInfoRowsHeader").tmpl();
                //renderedOutput.appendTo(infoTable );

                var planArray = WCC.model.emailPlans.get();
                WCC.sortAndSearch.setSearchField('pack_name');
                WCC.sortAndSearch.setSortType('pack_name');
                WCC.sortAndSearch.defineCacheObj(planArray);
                fullDataRowArray = WCC.sortAndSearch.generateOutput(); // WCC.cache.sortObj( planArray, sortType, sortOrder);
            }

            else if (WCC.sortAndSearch.returnFilterField() == 'forwarding_plans' &&  WCC.sortAndSearch.returnFilterValue() == null)
            {
              //$(".second-actions").hide();
                WCC.sortAndSearch.setSearchField('delivery_mode');
                //renderedOutput = $("#emailPlanInfoRowsHeader").tmpl();
                //renderedOutput.appendTo(infoTable );

                var planArray = WCC.email.returnForwardingPackArray();
                WCC.sortAndSearch.defineCacheObj(planArray);
                fullDataRowArray = WCC.sortAndSearch.generateOutput();

            }

            else if (WCC.sortAndSearch.returnFilterField() == 'unused_plans' &&  WCC.sortAndSearch.returnFilterValue() == null)
            {
              //$(".second-actions").hide();
                WCC.sortAndSearch.setSearchField('pack_name');
                //renderedOutput = $("#emailPlanInfoRowsHeader").tmpl();
                //renderedOutput.appendTo(infoTable );

                var planArray = WCC.email.returnUnusedPackArray();
                WCC.sortAndSearch.defineCacheObj(planArray);
                fullDataRowArray = WCC.sortAndSearch.generateOutput();

            }
            else if (WCC.sortAndSearch.returnFilterField() == 'all_domains' &&  WCC.sortAndSearch.returnFilterValue() == null)
            {
              WCC.sortAndSearch.setSearchField('domain');
                renderedOutput = $("#emailDomainInfoRowsHeader").tmpl();
                renderedOutput.appendTo(infoTable );

                if (WCC.sortAndSearch.returnSearchTerm() == null)
                {
                    var domainArray = WCC.model.domains.get();
                    WCC.sortAndSearch.defineCacheObj(domainArray);
                    fullDataRowArray = WCC.sortAndSearch.generateOutput();
                }
                else
                {
                    // do some filtering
                    var domainArray = WCC.model.domains.get();
                    WCC.sortAndSearch.defineCacheObj(domainArray);
                    fullDataRowArray = [];
                    for (var k in domainArray)
                    {
                        if (domainArray[k].indexOf(WCC.sortAndSearch.returnSearchTerm()) > -1)
                        {
                            fullDataRowArray[fullDataRowArray.length] = domainArray[k];
                        }

                    }
                }

            }
            else if (WCC.sortAndSearch.returnFilterField() == 'domain' &&  WCC.sortAndSearch.returnFilterValue() != null)
            {
                WCC.sortAndSearch.setSearchField('displayName');
                renderedOutput = $("#emailViewDomainHeader").tmpl(); // renderedOutput = $("#viewDomainHeader").tmpl();
                renderedOutput.appendTo(infoTable );

                renderedOutput = $.tmpl('emailInfoRowsHeader');
                renderedOutput.appendTo(infoTable );

                var domainArray = WCC.model.domains.get();
                WCC.sortAndSearch.defineCacheObj(cacheObj);
                fullDataRowArray = WCC.sortAndSearch.generateOutput();

            }

            else
            {
                WCC.sortAndSearch.setSearchField('displayName');
                renderedOutput = $.tmpl('emailInfoRowsHeader');
                renderedOutput.appendTo(infoTable );
                WCC.sortAndSearch.defineCacheObj(cacheObj);
                fullDataRowArray = WCC.sortAndSearch.generateOutput();
            }

            // resort by the appropriate thing...
            // fullDataRowArray = WCC.sortAndSearch.filter(fullDataRowArray);
            var searchTerm = WCC.sortAndSearch.returnSearchTerm();
            var searchField = WCC.sortAndSearch.returnSearchField();

            if (fullDataRowArray.length==0 &&  WCC.sortAndSearch.returnFilterValue() != null)
            {
                 // put in some fake stuff
                infoTable.empty();
                WCC.email.tackOnPlanHeader(infoTable);


                renderedOutput = $.tmpl('emailInfoRowsHeader');
                renderedOutput.appendTo(infoTable );

                var rowClass = 'even';
                var dataRowArray = [];

                while (dataRowArray.length < 10)
                {
                    dataRowArray[dataRowArray.length] = {};
                }

                for (var k in dataRowArray)
                {
                    if (rowClass == 'even')
                    {
                        rowClass = 'odd';
                    }
                    else
                    {
                        rowClass = 'even';
                    }

                    var output = dataRowArray[k];

                    output.rowClass = rowClass;

                    renderedOutput = $.tmpl('emailInfoRows', output);
                    renderedOutput.appendTo( infoTable );
                }

                WCC.email.handleEmailAreaWidth();



                var showRegular = true;
                if (WCC.sortAndSearch.returnFilterField() == "pack_id")
                {
                    for (k in emailPlans)
                    {
                        if (emailPlans[k]['pack_id'] == WCC.sortAndSearch.returnFilterValue())
                        {
                            if (emailPlans[k]['delivery_mode'] == 'forward')
                            {
                                showRegular = false;
                            }
                        }
                    }
                }

                if (showRegular == false)
                {
                    renderedOutput = $("#emailForwardingNoAccountMessage").tmpl();
                }
                else
                {
                    renderedOutput = $("#emailNoAccountMessage").tmpl();
                }

                $('#noAccountMessageArea').html( renderedOutput);
                var userAddressWidth = $('#noAccountMessageArea').width();
                $('#no-account-owned').width(userAddressWidth);

                WCC.utils.positionMiniNoAccountsArea();
                $(window).resize(function(){WCC.utils.positionMiniNoAccountsArea();});

                WCC.components.analytics.init($('#infoTable'));
                return;
            }

            // deal with search stuff
            if (searchTerm != null && searchTerm != null)
            {
                if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans'  || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans')
                {
                    renderedOutput = $("#emailPlanSearchRow").tmpl({'searchTerm': searchTerm});
                }
                else
                {
                    renderedOutput = $("#searchRow").tmpl({'searchTerm': searchTerm});
                }

                renderedOutput.appendTo(infoTable);
            }

            // set up pagination

            // first for all plnas
            if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans'  || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans')
            {

              var numPlanRows = 25;
              var dataRowArray = fullDataRowArray;

              // fix the pagination if you choose something that shortens the number of possible pages...
              var totalPages = Math.ceil(fullDataRowArray.length/numPlanRows);
              if (WCC.pagination.returnCurrentPage() > totalPages)
              {
                WCC.pagination.setCurrentPage(totalPages);
              }

              var startItem = (WCC.pagination.returnCurrentPage() - 1) * numPlanRows;
              var endItem = WCC.pagination.returnCurrentPage() * numPlanRows;
              var dataRowArray = fullDataRowArray.slice(startItem, endItem);

              var allOpenPlansArray = WCC.email.returnOpenPlansOnCurrentPage();
            }
            else
            {
              // fix the pagination if you choose something that shortens the number of possible pages...
              var totalPages = Math.ceil(fullDataRowArray.length/WCC.pagination.returnRowsPerPage());
              if (WCC.pagination.returnCurrentPage() > totalPages)
              {
                  WCC.pagination.setCurrentPage(totalPages);
              }

              var startItem = (WCC.pagination.returnCurrentPage() - 1) * WCC.pagination.returnRowsPerPage();
              var endItem = WCC.pagination.returnCurrentPage() * WCC.pagination.returnRowsPerPage();

              var dataRowArray = fullDataRowArray.slice(startItem, endItem);
            }


            // pad it if necessary
            while (dataRowArray.length < 10)
            {
                dataRowArray[dataRowArray.length] = {};
            }


            konsole.markTime('rendering', 'starting cycle');
            var output = {};
            for (var k in dataRowArray)
            {
                if (rowClass == undefined || rowClass == 'even')
                {
                    rowClass = 'odd';
                }
                else
                {
                    rowClass = 'even';
                }

                output = dataRowArray[k];

                output.rowClass = rowClass;

                if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans' || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans' )
                {
                    if (dataRowArray[k]['pack_id'] != undefined)
                    {
                      output.mySize = WCC.email.getPlanSizeData(dataRowArray[k]['pack_id']);
                      renderedOutput = $.tmpl('emailViewPlanListHeader', output);
                      renderedOutput.data('infoData', output);
                    }
                }
                else if (WCC.sortAndSearch.returnFilterField() == 'all_domains')
                {
                    if (WCC.sortAndSearch.returnSearchTerm() != '')
                    {
                    ;
                    }

                    output = {};
                    if (typeof(dataRowArray[k])=='string')
                    {
                        output.domain = dataRowArray[k];

                    }
                    else
                    {
                         output.domain = null;
                    }

                    output.rowClass = rowClass;

                    renderedOutput = $("#emailDomainInfoRows").tmpl(output);
                    renderedOutput.data('infoData', output);
                }
                else
                {
                  // this is where the regular old email view renders from
                  renderedOutput = $.tmpl('emailInfoRows', output);
                  renderedOutput.data('infoData', output);
                }


                // change the color of the row when we've moused over it...
                if (WCC.sortAndSearch.returnFilterField() != 'all_plans' && WCC.sortAndSearch.returnFilterField() != 'unused_plans' && WCC.sortAndSearch.returnFilterField() != 'forwarding_plans' )
                {
                    renderedOutput.hover(
                        function()
                            {$(this).addClass("tr-hover");},
                        function()
                            {$(this).removeClass("tr-hover");}
                    );
                }



                if (renderedOutput != undefined)
                {
                    renderedOutput.appendTo( infoTable );
                }
                else
                {
                    // failsafe content filler so if you select a view with no plans or email addresses or anything
                    renderedOutput = $.tmpl('emailInfoRowsHeader');
                    renderedOutput.appendTo(infoTable );

                    var rowClass = 'even';
                    var dataRowArray = [];

                    while (dataRowArray.length < 10)
                    {
                        dataRowArray[dataRowArray.length] = {};
                    }

                    for (var z in dataRowArray)
                    {
                        if (rowClass == 'even')
                        {
                            rowClass = 'odd';
                        }
                        else
                        {
                            rowClass = 'even';
                        }

                        var output = dataRowArray[z];

                        output.rowClass = rowClass;

                        renderedOutput = $.tmpl('emailInfoRows', output);
                        renderedOutput.appendTo( infoTable );
                    }
                }

                // handle expanded plan view stuff
                if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans' || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans' )
                {
                    if (dataRowArray[k]['pack_id'] != undefined && $.inArray(dataRowArray[k]['pack_id'], allOpenPlansArray) !== -1 )
                    {

                      renderedOutput = $.tmpl('emailPlanViewInfoRowsHeader',{pack_id: dataRowArray[k]['pack_id']});
                      renderedOutput.appendTo( infoTable );

                      // now go though stuff... and append it
                      var itemCount = 0;

                      if (jQuery.inArray(dataRowArray[k]['pack_id'], planLoadingArray) != -1)
                      {
                        renderedOutput = $.tmpl('loadingEmailInfoRows');
                        renderedOutput.appendTo( infoTable );
                      }
                      else
                      {

                        // is the stuff we need cached? If yes, let's just use that
                        // otherwise, let's just cache everything and go from there...
                        var cacheKey = 'emailAddressesForPackId_' + dataRowArray[k]['pack_id'];

                        if (WCC.tmpObjCache.get(cacheKey) == null )
                        {
                          // build a temporary array to store these things
                          var tmpArray = {};
                          for (var x in cacheObj)
                          {
                            var objPackId = cacheObj[x]['pack_id'];
                            if (tmpArray[objPackId] == undefined)
                            {
                              tmpArray[objPackId] = [];
                            }

                            tmpArray[objPackId][tmpArray[objPackId].length] = cacheObj[x];
                          }

                          var thePackId = null;
                          for (var x in emailPlans )
                          {
                            thePackId = emailPlans[x]['pack_id'];
                            if (tmpArray[thePackId] == undefined)
                            {
                              WCC.tmpObjCache.set('emailAddressesForPackId_' + thePackId, [], 300);
                            }
                            else
                            {
                              WCC.tmpObjCache.set('emailAddressesForPackId_' + thePackId, tmpArray[thePackId], 300);
                            }
                          }

                        }


                        var outputEmailsFoPlans = WCC.tmpObjCache.get(cacheKey);
                        if (outputEmailsFoPlans != null)
                        {
                          for (var x in outputEmailsFoPlans)
                          {
                            itemCount++;
                            if (rowClass == 'even')
                            {
                                rowClass = 'odd';
                            }
                            else
                            {
                                rowClass = 'even';
                            }

                            output = outputEmailsFoPlans[x];

                            output.rowClass = rowClass;
                            renderedOutput = $.tmpl('emailPlanViewInfoRows',output);
                            renderedOutput.data('infoData', output);
                            renderedOutput.appendTo( infoTable );
                          }
                        }

                        if (itemCount == 0)
                        {
                          renderedOutput = $.tmpl('blankEmailInfoRows');
                          renderedOutput.appendTo( infoTable );
                        }
                      }
                    }
                }

            }
            konsole.markTime('rendering', 'end of cycle');

            var progressBars = $('.table-progress-bar');
            for (var x = 0; x < progressBars.length; x++)
            {
                var percentage = $(progressBars[x]).attr('percentage');
                $(progressBars[x]).progressbar({value:Math.round(percentage)});
            }

            if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans'  || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans')
            {
              var paginationHTML = WCC.pagination.returnPagination(planArray, false, true, numPlanRows);
              $("#paginationArea").html(paginationHTML);
            }
            else
            {
              var paginationHTML = WCC.pagination.returnPagination(fullDataRowArray);
              $("#paginationArea").html(paginationHTML);
            }

            WCC.hover.attach('email');

            // add the handler to the check boxes
            infoTable.find('input[type="checkbox"]').bind('click', function(){WCC.utils.handleBoxCheck(this);} );

            // fix the width of the address stuff
            WCC.email.handleEmailAreaWidth();

            //attach the generic tooltip
//            WCC.utils.attachToolTip('tip');
           require(["starfield/sf.tipper"], function () {
                $(document).sfTipper({wireup: true });
            });

            WCC.email.setupUsernameResize();

            // click to edit
            $('.emailClickToEdit').click(function(){
                var infoData = $(this).parent().parent().parent().data('infoData');
                if (infoData != undefined)
                {
                    if (infoData.delivery_mode == 'local')
                    {
                        WCC.components.editAccount.open(infoData);
                    }
                    else
                    {
                        WCC.components.editForwarding.open(infoData);
                    }
                }

                return false;
            });

            // gripper don't work in IE?
            if (WCC.sortAndSearch.returnFilterField() == "pack_id" && WCC.utils.isIE() == true && WCC.utils.getIEVersion() < 9)
            {
                $('.theGripper').hide();
            }
            else
            {
                $('.theGripper').show();
            }

            WCC.email.doCookieWidth();
            WCC.email.handleTooWide();

            setTimeout(function(){WCC.email.handleUsernameResize()}, 200);

            // add the analytics
            WCC.components.analytics.init($('#infoTable'));

            konsole.markTime('rendering', 'done');
        },


        doCookieWidth: function()
        {
            if ($.cookie('emailUserNameHeaderWidth') != null)
            {
                var cookieWidth = $.cookie('emailUserNameHeaderWidth');

                //$(".userNameHeader").width(cookieWidth - 20);
                //$('.resizeContainer').width(cookieWidth + 10);
                //$('.user-name').width(cookieWidth + 10);
                WCC.email.handleUsernameResize(null, cookieWidth);
                //$('.user-name-container').width(cookieWidth - 20)

            }
        },


        setupUsernameResize: function()
        {
            $.throttle(250, WCC.email.setupUsernameResizeAction )();
        },



         /**
         * Here's where me make the alert column resizable and handle all the stuff
         * that goes along with that
         *
         */
        setupUsernameResizeAction: function()
        {
            var maxWidth = $('.main-content-container').width() - 325;

            var resizeOpts = {};
            resizeOpts.vertical = false;
            resizeOpts.onresizemove = function(event, newwidth, newheight){WCC.email.handleUsernameResize(event, newwidth, newheight)};
            resizeOpts.onresizestart = function(event, newwidth, newheight ){whichGripper = $(event.target);WCC.hover.flyoutHide();currentlyResizingUsername = true};
            resizeOpts.onresizestop = function(){WCC.email.handleResizeSave();currentlyResizingUsername = false;};
            resizeOpts.maxwidth = maxWidth;
            resizeOpts.dragToResizeText = BRAVO.Translate._("WCC_MAIN_dragToResize");

            $('.resizable').bravo_resizable(resizeOpts)

            WCC.email.handleUsernameResize();

        },

        handleUsernameResize: function(event, newWidth, newheight)
        {
            $.throttle(10, function(){WCC.email.handleUsernameResizeAction(event, newWidth, newheight)})();
        },



        /**
         * Handle the resize for the Account Alerts column
         *
         */
        handleUsernameResizeAction: function(event, newWidth, newheight)
        {

            // original format?
            // sorry... I know this is kind of ugly, but it's all a very delicate balance
            // I'm sure a more clever person with more time could make it work better.
            if ($('#infoTable .alertHeader').length == 0)
            {
                // var maxWidth = $('.main-content-container').width() - 368;
                //var maxWidth = $('.main-content-container').width() - 375;
                var maxWidth = $('.main-content-container').width() - 500;
                if ($('#resizeContainer').width() > maxWidth)
                {
                    $('#resizeContainer').width(maxWidth);
                }

                // don't ask... don't remove. This is totally how it's supposed to work
                $('#userNameHeader').width($('#resizeContainer').width());
                $('#resizeContainer').width($('#userNameHeader').width());

                // adjust the div inside the appropriate columns
                var planNameHeaderWidth = $('#planNameHeader').width();
                var userNameHeaderWidth = $("#userNameHeader").width() - 30;
                var quotaHeaderWidth = $('#quotaHeader').width();

                var planNames = $('#infoTable').find('.resizePlanName');
                planNames.width(planNameHeaderWidth);
                $('#infoTable').find('.user-name-container').width(userNameHeaderWidth);

                if (quotaHeaderWidth >= 150)
                {
                    $('#quotaHeader').width(150);
                    quotaHeaderWidth = 150;
                }
                else
                {
                     $('#quotaHeader').css('width', '');
                }

                var quotas = $('#infoTable').find('.resizeQuota');
                quotas.width(quotaHeaderWidth);
                if (quotaHeaderWidth < 150)
                {
                    quotas.find('.table-progress-bar').hide();
                }
                else
                {
                    quotas.find('.table-progress-bar').show();

                    var quotaList = $('.used-quota');

                    for (var x = 0; x < quotaList.length; x++)
                    {
                        var quotaArea = $(quotaList[x]);

                        if (quotaArea.width() < 80)
                        {
                            quotaArea.parent().find('.table-progress-bar').hide();
                        }
                    }
                }

                $('.domain-name-container').width($('#main-wrapper').width() - 430)

                return;
            }


            // otherwise, this is a plan view page
            var infoTable = $('#infoTable');
            var maxWidth = $('.main-content-container').width() - 500; // 425


            if (newWidth == undefined)
            {
                if ($('.userNameHeader').width() != $('.resizeContainer').width() )
                {
                    newWidth = $('.userNameHeader').width();
                }
                else if( $('#infoTable').width() > $('.main-content-container').width())
                {
                    newWidth = maxWidth - 20;
                }
                else if ($('.resizeContainer').width() + 20 < $('.user-name-container').width())
                {
                    newWidth = maxWidth;
                }
                else
                {
                    return;
                }
            }

            // handle max / min widths
            if (newWidth < 100)
            {
                newWidth = 100;
            }
            if (newWidth > maxWidth)
            {
                newWidth = maxWidth;
            }

            // do a bunch of resizing
            infoTable.find('.resizeContainer').width(newWidth);
            infoTable.find('.user-name').width(newWidth);
            infoTable.find('.userNameHeader').width(infoTable.find('.resizeContainer').width() );
            infoTable.find('.user-name-container').width(newWidth - 20);

            // internet explore table handling leaves something to be desired...
            if (WCC.utils.isIE())
            {
                var newWidth = $('.main-content-container').width() - $('.resizeContainer').width() - 430;
                $('.quotaHeader').width(newWidth);
            }

            // the quota css handleing
            var quotaTrigger = 200;

            if ($('#infoTable .alertHeader').length > 0)
            {
                $('.resizeQuota').width($('.quotaHeader').width() - 10);
                quotaTrigger = 165;
            }
            else
            {

                if (quotaHeaderWidth >= quotaTrigger)
                {
                    $('#infoTable .quotaHeader').width(quotaTrigger);
                }
                else
                {
                     $('#infoTable .quotaHeader').css('width', '');
                }

                var quotas = $('.resizeQuota');
                quotas.width(quotaHeaderWidth);
            }

            return;
        },


        handleTooWide: function()
        {

          var mainWidth = $('.main-table-style').width();
          var availableWidth = 0;
          var thisPlanView = null;
          var headerData = null;
          var planListOther = null
          var planListAdd = null;
          var initialHeaderDataWidth = 0;
          var planListSpacer = null;
          var spacerWidth = 0;
          var planListRibbon = null;
          var planListRibbonWidth = 0;


          var planViewHeaders = $('.emailPlanViewHeaderInfo');
          for (var x = 0; x < planViewHeaders.length; x++)
          {
            thisPlanView =  $(planViewHeaders[x]);

            initialHeaderDataWidth = thisPlanView.find('.emailViewPlanListHeaderDataPackName').width();


            headerData = thisPlanView.find('.emailViewPlanListHeaderData');

             planListRibbon = thisPlanView.find('.ribbon-message');
             planListRibbonWidth = + planListRibbon.width() + 10;

            planListOther = thisPlanView.find('.emailViewPlanListHeaderOther');

            planListAdd = thisPlanView.find('.emailViewPlanListHeaderAdd');


            planListSpacer = thisPlanView.find('.emailViewPlanListHeaderSpacer');

            availableWidth = mainWidth- 40 - planListOther.width() - planListAdd.width() - planListRibbon.width() ;

            if (initialHeaderDataWidth > availableWidth)
            {
              headerData.width(availableWidth - planListRibbonWidth - 20);
              spacerWidth = 10;
            }
            else
            {
              headerData.width(initialHeaderDataWidth + planListRibbonWidth );
              spacerWidth =  mainWidth - 40 - planListOther.width() - planListAdd.width() - headerData.width() - planListRibbon.width() ;
            }


            if (spacerWidth < 10)
            {
              spacerWidth = 10;
              headerData.width(initialHeaderDataWidth + planListRibbonWidth  - 20);
            }
            planListSpacer.width(spacerWidth);


          }

            return;
            var maxWidth =  $('.table-top').width() - 400;
            var emailviewPlanListNames = $('.emailViewPlanListHeaderData');
            emailviewPlanListNames.css('max-width' ,maxWidth + 'px');
            if (WCC.utils.isIE() == true)
            {
                emailviewPlanListNames.width(maxWidth);
            }


            $('.resizeQuota').width($('.quotaHeader').width() - 10);
             if ($('#infoTable').width() - 10 > $('.table-top').width())
            {
                tooWideCount = tooWideCount +1;

                if (tooWideCount > 100)
                {
                    return;
                }
                setTimeout(function(){WCC.email.handleTooWide()}, 100);
            }
            if(typeof(this.showSelectedAll)!='undefined') {
                this.showSelectedAll();
            }
        },



        /**
         * Save the new resize size to a cookie
         *
         */
        handleResizeSave: function(event, newwidth, newheight)
        {
            var userNameHeaderWidth = $('.userNameHeader').width();

            if ($.cookie('emailUserNameHeaderWidth') != userNameHeaderWidth)
            {
                $.cookie('emailUserNameHeaderWidth', userNameHeaderWidth, {expires: 365});
            }
        },


        handlePlanExpandClick: function(pack_uid)
        {
            var planExpander = $('#planExpandClick_' + pack_uid);
            if (planExpander.hasClass('show-button'))
            {
                WCC.userSettings.set('planOpen' + pack_uid, "open");
                planExpander.addClass('hide-button');
                planExpander.removeClass('show-button');
            }
            else
            {
                WCC.userSettings.set('planOpen' + pack_uid, "closed");
                planExpander.addClass('show-button');
                planExpander.removeClass('hide-button');
            }
            WCC.tmpObjCache.remove('returnOpenPlansOnCurrentPage');
            WCC.email.renderAccountRows();
        },



        showSelectedAll: function()
        {
            $('.selectAllRow').remove();
            var selectedThingOutput = WCC.utils.decideWhetherToShowAllSelectedThing(fullDataRowArray);
            if (selectedThingOutput != false)
            {
                selectedThingOutput.insertBefore( "#infoRowHeader" );
            }
        },


        handleEmailAreaWidth: function()
        {
            if (WCC.sortAndSearch.returnFilterField() == 'all_plans' || WCC.sortAndSearch.returnFilterField() == 'unused_plans' || WCC.sortAndSearch.returnFilterField() == 'forwarding_plans')
            {
               WCC.utils.handleUserAddressWidth(300);
            }
            else
            {
                // fix the width of the address stuff
                WCC.utils.handleUserAddressWidth(600);
            }



        },


        /**
         * Retry problematic MXs
         *
         */
        retryMX: function(emailAddress)
        {
            var that = this;
            $.ajax({
                type: "POST",
                url: 'ajaxemail/retrymx/',
                data: {'emailAddress': emailAddress, 'postToken':Globals.POST_TOKEN},
                dataType : 'json',
                success: function(data) {retryMXSuccess.call(that, data);},
                error: WCC.utils.handleError
            });

            return true;
        },


        hasRelays: function(emailAddress)
        {
          if (WCC.tmpObjCache.get('hasRelays-'+ emailAddress) != null)
          {
            return WCC.tmpObjCache.get('hasRelays-'+ emailAddress);
          }
            var cacheThing = WCC.cache.returnCacheObject();
            var match = null;
            var relaysPerDay = null;
            var relaysToday = null;
            for (var x in cacheThing)
            {
                if (cacheThing[x]['emailAddress'] == emailAddress)
                {
                    match = x;
                    break;
                }
            }

            if (match == null)
            {
                return false;
            }

            if (cacheThing[match]['relaysPerDay'] != undefined)
            {
                relaysPerDay = cacheThing[match]['relaysPerDay'];
            }

            if (cacheThing[match]['relaysToday'] != undefined)
            {
                relaysToday = cacheThing[match]['relaysToday'];
            }

            if (relaysPerDay != null && relaysToday != null)
            {
              WCC.tmpObjCache.set('hasRelays-'+ emailAddress, true, 1000);
              return true
            }


        }
    };

}());




$(document).bind('templatesLoaded', function()
{
    if (Globals.thisPage == 'email')
    {
      setTimeout(function(){WCC.email.init();}, 100);
    }




});

