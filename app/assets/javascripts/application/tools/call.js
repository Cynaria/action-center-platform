$(document).on('ready', function() {
  if($('#call-tool').length > 0){
    height_changed();

    var call_campaign_id = $('[data-call-campaign-id]').attr('data-call-campaign-id');
    var $phone_number_field = $("#inputPhone");
    var $zip_field = $("#inputZip");
    var $street_address_field = $("#inputStreetAddress");
    var required_location = !!$street_address_field.length;

    $phone_number_field.each(function(){
      $(this).bfhphone($(this).data());
    });

    function determine_location(cb, zip_code, street_address){
      if(required_location) {
        // When address field is present, lookup congressional district
        $.ajax({
          url: '/smarty_streets/street_address/?street=' + encodeURIComponent(street_address) + '&zipcode=' + encodeURIComponent(zip_code),
          success: function(res){
            if(res.length == 1){
              var state = res[0].components.state_abbreviation;
              var district = res[0].metadata.congressional_district;
              cb(null, state + "-" + district);
            }
          },
          error: function(err){
            cb(err);
          }
        });
      } else {
        // When address field is not present, use zip code for location
        cb(null, zip_code);
      }
    }

    function show_form(){
      $('.call-body-phone-saved').addClass('hidden');
      $('.tool-title.precall').removeClass('hidden');
      $('.tool-title.postcall').addClass('hidden');
      $('.call-body-phone-not-saved').removeClass('hidden');
      $('.call-body-active').addClass('hidden');
    }
    function hide_form(){
      $('.tool-title.precall').addClass('hidden');
      $('.tool-title.postcall').removeClass('hidden');
      $('.call-body-phone-not-saved').addClass('hidden');
      $('.call-body-active').removeClass('hidden');
      $('.call-body-phone-saved').addClass('hidden');
    }

    $('form.call-tool, form.call-tool-saved').on('submit', function(ev) {
      var form = $(ev.currentTarget);

      var update_user_data = $('#update_user_data', form).val();
      var phone_number = $phone_number_field.val().replace(/[^\d.]/g, '');
      var street_address = $street_address_field.val();
      var zip_code = ($zip_field.val() || "").replace(/[^\d.]/g, '').slice(0,5);
      var action_id = $('[name="action-id"]', form).val();

      if (!isValidPhoneNumber(phone_number)){
        rumbleEl($phone_number_field);
      } else if ($zip_field.length && zip_code.length != 5) {
        rumbleEl($zip_field);
      } else {
        determine_location(function(err, location){
          hide_form();
          height_changed();

          var fd = new FormData();
          fd.append("action_id", action_id);
          fd.append("call_campaign_id", call_campaign_id);
          fd.append("phone", phone_number);
          fd.append("location", location);
          if (street_address != '')
            fd.append("street_address", street_address);
          fd.append("zipcode", zip_code);
          fd.append("update_user_data", update_user_data);

          if (form.find("input[name=subscribe]:checked").val() == "1") {
            fd.append("subscription[email]", form.find("input[type=email]").val());
            fd.append("subscription[zipcode]", zip_code);
            form.attr("data-signed-up-for-mailings", "true");
          }

          $.ajax({
            url: "/tools/call",
            type: "POST",
            data: fd,
            processData: false,
            contentType: false
          });
        }, zip_code, street_address);
      }

      ev.preventDefault();
    });

    $('.call-tool-try-again').on('click', function(ev){
      show_form();
      height_changed();
      return false;
    });

    $('.call-tool-different-number').on('click', function(ev){
      show_form();
      $('#inputPhone').val('').focus();
      height_changed();
      return false;
    });
  }
});
