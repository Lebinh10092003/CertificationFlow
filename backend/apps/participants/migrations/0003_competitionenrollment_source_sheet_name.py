from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("participants", "0002_competitionenrollment_source_data_json"),
    ]

    operations = [
        migrations.AddField(
            model_name="competitionenrollment",
            name="source_sheet_name",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
