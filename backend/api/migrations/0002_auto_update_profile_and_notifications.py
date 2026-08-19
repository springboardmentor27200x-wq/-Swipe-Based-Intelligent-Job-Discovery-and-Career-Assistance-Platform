# Generated migration for SwipeX updates

from django.db import migrations, models
import django.db.models.deletion
import uuid

SQL_PROFILE_UPDATE = """
DO $$
BEGIN
    -- Profile columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='target_domain') THEN
        ALTER TABLE api_profile ADD COLUMN target_domain varchar(50) DEFAULT 'ai_ml';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='resume_name') THEN
        ALTER TABLE api_profile ADD COLUMN resume_name varchar(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='resume_text') THEN
        ALTER TABLE api_profile ADD COLUMN resume_text text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='date_of_birth') THEN
        ALTER TABLE api_profile ADD COLUMN date_of_birth varchar(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='phone') THEN
        ALTER TABLE api_profile ADD COLUMN phone varchar(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='location') THEN
        ALTER TABLE api_profile ADD COLUMN location varchar(150);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='education') THEN
        ALTER TABLE api_profile ADD COLUMN education varchar(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='experience_years') THEN
        ALTER TABLE api_profile ADD COLUMN experience_years varchar(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='portfolio_url') THEN
        ALTER TABLE api_profile ADD COLUMN portfolio_url varchar(512);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='github_url') THEN
        ALTER TABLE api_profile ADD COLUMN github_url varchar(512);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_profile' AND column_name='linkedin_url') THEN
        ALTER TABLE api_profile ADD COLUMN linkedin_url varchar(512);
    END IF;

    -- Match columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_match' AND column_name='cover_note') THEN
        ALTER TABLE api_match ADD COLUMN cover_note text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_match' AND column_name='interview_date') THEN
        ALTER TABLE api_match ADD COLUMN interview_date varchar(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_match' AND column_name='interview_type') THEN
        ALTER TABLE api_match ADD COLUMN interview_type varchar(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_match' AND column_name='applied_at') THEN
        ALTER TABLE api_match ADD COLUMN applied_at timestamp with time zone;
    END IF;

    -- Create api_notification table if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='api_notification') THEN
        CREATE TABLE api_notification (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            type varchar(50) NOT NULL DEFAULT 'mutual_match',
            title varchar(255) NOT NULL,
            message text NOT NULL,
            link varchar(255) DEFAULT '/applications',
            is_read boolean NOT NULL DEFAULT false,
            badge varchar(50) DEFAULT 'Match',
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            user_id uuid NOT NULL REFERENCES api_user(id) ON DELETE CASCADE
        );
    END IF;
END $$;
"""

SQL_REVERSE = """
-- No reverse needed
"""


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(SQL_PROFILE_UPDATE, reverse_sql=SQL_REVERSE)
            ],
            state_operations=[
                migrations.AddField(
                    model_name='profile',
                    name='target_domain',
                    field=models.CharField(blank=True, default='ai_ml', max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='resume_name',
                    field=models.CharField(blank=True, max_length=255, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='resume_text',
                    field=models.TextField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='date_of_birth',
                    field=models.CharField(blank=True, max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='phone',
                    field=models.CharField(blank=True, max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='location',
                    field=models.CharField(blank=True, max_length=150, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='education',
                    field=models.CharField(blank=True, max_length=255, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='experience_years',
                    field=models.CharField(blank=True, max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='portfolio_url',
                    field=models.URLField(blank=True, max_length=512, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='github_url',
                    field=models.URLField(blank=True, max_length=512, null=True),
                ),
                migrations.AddField(
                    model_name='profile',
                    name='linkedin_url',
                    field=models.URLField(blank=True, max_length=512, null=True),
                ),
                migrations.AlterField(
                    model_name='profile',
                    name='avatar_url',
                    field=models.TextField(blank=True, null=True),
                ),
                migrations.AlterField(
                    model_name='profile',
                    name='resume_url',
                    field=models.TextField(blank=True, null=True),
                ),
                migrations.AlterField(
                    model_name='job',
                    name='company_logo',
                    field=models.TextField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='match',
                    name='cover_note',
                    field=models.TextField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='match',
                    name='interview_date',
                    field=models.CharField(blank=True, max_length=100, null=True),
                ),
                migrations.AddField(
                    model_name='match',
                    name='interview_type',
                    field=models.CharField(blank=True, max_length=100, null=True),
                ),
                migrations.AddField(
                    model_name='match',
                    name='applied_at',
                    field=models.DateTimeField(blank=True, null=True),
                ),
                migrations.AlterField(
                    model_name='match',
                    name='status',
                    field=models.CharField(choices=[('swiped_left', 'Swiped Left'), ('swiped_right', 'Swiped Right'), ('matched', 'Matched'), ('saved_pending', 'Saved Pending'), ('applied', 'Applied'), ('shortlisted', 'Shortlisted'), ('interview_scheduled', 'Interview Scheduled'), ('selected', 'Selected / Hired'), ('rejected', 'Rejected')], default='swiped_right', max_length=30),
                ),
                migrations.CreateModel(
                    name='Notification',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('type', models.CharField(default='mutual_match', max_length=50)),
                        ('title', models.CharField(max_length=255)),
                        ('message', models.TextField()),
                        ('link', models.CharField(blank=True, default='/applications', max_length=255, null=True)),
                        ('is_read', models.BooleanField(default=False)),
                        ('badge', models.CharField(blank=True, default='Match', max_length=50, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='api.user')),
                    ],
                    options={
                        'ordering': ['-created_at'],
                    },
                ),
            ]
        )
    ]
