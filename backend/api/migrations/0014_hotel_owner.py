from django.db import migrations, models
import django.db.models.deletion


def link_existing_vendor_hotels(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')
    Hotel = apps.get_model('api', 'Hotel')
    for vendor in UserProfile.objects.filter(role='VENDOR').exclude(hotel_id=None):
        Hotel.objects.filter(pk=vendor.hotel_id, owner_id=None).update(owner_id=vendor.id)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_rename_razorpay_refund_id_booking_refund_reference'),
    ]

    operations = [
        migrations.AddField(
            model_name='hotel',
            name='owner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='owned_hotels',
                to='api.userprofile',
            ),
        ),
        migrations.RunPython(link_existing_vendor_hotels, migrations.RunPython.noop),
    ]
