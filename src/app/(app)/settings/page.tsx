
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Grid } from '@/components/ui/grid'; // Assuming a Grid component for layout

import { 
  Settings as SettingsIcon,
  Bell,
  Shield, 
  Brush, 
  Database, 
  Link as LinkIcon
} from 'lucide-react';


export default function SettingsPage() {
  const [settings, setSettings] = useState({
    general: {
      companyName: '',
      timezone: '',
      defaultCurrency: '',
      dateFormat: '',
    },
    notifications: {
      emailNotifications: false,
      pushNotifications: false,
      lowStockAlerts: false,
      paymentReminders: false,
      systemMaintenance: false,
      notificationEmail: '',
    },
    security: {
      twoFactorAuth: false,
      strongPasswordPolicy: false,
      autoSessionTimeout: false,
      sessionDuration: 30,
      maxLoginAttempts: 5,
    },
    appearance: {
      theme: 'light',
      sidebarPosition: 'left',
      compactMode: false,
      enableAnimations: false,
    },
    system: {
      backupFrequency: '',
      logRetention: 90,
      automaticUpdates: false,
      maintenanceMode: false,
    },
    integrations: {
      emailService: {
        enableEmail: false,
        smtpServer: '',
        port: null,
      },
      paymentGateway: {
        enablePayments: false,
        provider: '',
      },
      apiSettings: {
        enableApi: false,
        rateLimit: 1000,
        apiKey: '', // Assuming there's an API key to generate/display
      },
    },
  });

  const handleInputChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value,
      },
    }));
  };

  const handleToggleChange = (section, field, checked) => {
    handleInputChange(section, field, checked);
  };

  const handleSelectChange = (section, field, value) => {
    handleInputChange(section, field, value);
  };

  const handleNumberInputChange = (section, field, value) => {
    handleInputChange(section, field, Number(value));
  };
  
  const handleGenerateApiKey = () => {
      // Logic to generate API key
      console.log("Generate API Key clicked");
      // Update state with generated key
      // setSettings(prevSettings => ({
      //   ...prevSettings,
      //   integrations: {
      //     ...prevSettings.integrations,
      //     apiSettings: {
      //       ...prevSettings.integrations.apiSettings,
      //       apiKey: 'YOUR_GENERATED_KEY',
      //     },
      //   },
      // }));
    };

   const handleDatabaseMaintenance = () => {
       // Logic for database maintenance
       console.log("Database Maintenance clicked");
   };

  const handleSaveChanges = () => {
    console.log('Saving changes:', settings);
    // Implement saving logic here (e.g., API call)
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Settings"
          description="Manage your system preferences and configurations."
        />
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5 text-primary" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={settings.general.companyName} onChange={(e) => handleInputChange('general', 'companyName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.general.timezone} onValueChange={(value) => handleSelectChange('general', 'timezone', value)}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  {/* Add more timezone options */}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select value={settings.general.defaultCurrency} onValueChange={(value) => handleSelectChange('general', 'defaultCurrency', value)}>
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sar">SAR (﷼)</SelectItem>
                  {/* Add more currency options */}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={settings.general.dateFormat} onValueChange={(value) => handleSelectChange('general', 'dateFormat', value)}>
                <SelectTrigger id="dateFormat">
                  <SelectValue placeholder="Select a date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                   {/* Add more date format options */}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch id="emailNotifications" checked={settings.notifications.emailNotifications} onCheckedChange={(checked) => handleToggleChange('notifications', 'emailNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <Switch id="pushNotifications" checked={settings.notifications.pushNotifications} onCheckedChange={(checked) => handleToggleChange('notifications', 'pushNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
              <Switch id="lowStockAlerts" checked={settings.notifications.lowStockAlerts} onCheckedChange={(checked) => handleToggleChange('notifications', 'lowStockAlerts', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="paymentReminders">Payment Reminders</Label>
              <Switch id="paymentReminders" checked={settings.notifications.paymentReminders} onCheckedChange={(checked) => handleToggleChange('notifications', 'paymentReminders', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="systemMaintenance">System Maintenance</Label>
              <Switch id="systemMaintenance" checked={settings.notifications.systemMaintenance} onCheckedChange={(checked) => handleToggleChange('notifications', 'systemMaintenance', checked)} />
            </div>
            <div>
              <Label htmlFor="notificationEmail">Notification Email</Label>
              <Input id="notificationEmail" type="email" value={settings.notifications.notificationEmail} onChange={(e) => handleInputChange('notifications', 'notificationEmail', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="flex items-center justify-between">
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <Switch id="twoFactorAuth" checked={settings.security.twoFactorAuth} onCheckedChange={(checked) => handleToggleChange('security', 'twoFactorAuth', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="strongPasswordPolicy">Strong Password Policy</Label>
              <Switch id="strongPasswordPolicy" checked={settings.security.strongPasswordPolicy} onCheckedChange={(checked) => handleToggleChange('security', 'strongPasswordPolicy', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="autoSessionTimeout">Auto Session Timeout</Label>
              <Switch id="autoSessionTimeout" checked={settings.security.autoSessionTimeout} onCheckedChange={(checked) => handleToggleChange('security', 'autoSessionTimeout', checked)} />
            </div>
            <div>
              <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
              <Input id="sessionDuration" type="number" value={settings.security.sessionDuration} onChange={(e) => handleNumberInputChange('security', 'sessionDuration', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input id="maxLoginAttempts" type="number" value={settings.security.maxLoginAttempts} onChange={(e) => handleNumberInputChange('security', 'maxLoginAttempts', e.target.value)} />
            </div>
            <Button variant="outline" className="mt-2" onClick={() => console.log('Change Password clicked')}>Change Password</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brush className="mr-2 h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div>
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.appearance.theme} onValueChange={(value) => handleSelectChange('appearance', 'theme', value)}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                   {/* Add more themes */}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="sidebarPosition">Sidebar Position</Label>
              <Select value={settings.appearance.sidebarPosition} onValueChange={(value) => handleSelectChange('appearance', 'sidebarPosition', value)}>
                <SelectTrigger id="sidebarPosition">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <Switch id="compactMode" checked={settings.appearance.compactMode} onCheckedChange={(checked) => handleToggleChange('appearance', 'compactMode', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enableAnimations">Enable Animations</Label>
              <Switch id="enableAnimations" checked={settings.appearance.enableAnimations} onCheckedChange={(checked) => handleToggleChange('appearance', 'enableAnimations', checked)} />
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-primary" />
              System
            </CardTitle>
          </CardHeader>
           <CardContent className="grid gap-4">
             <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select value={settings.system.backupFrequency} onValueChange={(value) => handleSelectChange('system', 'backupFrequency', value)}>
                <SelectTrigger id="backupFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                   {/* Add more frequencies */}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="logRetention">Log Retention (days)</Label>
              <Input id="logRetention" type="number" value={settings.system.logRetention} onChange={(e) => handleNumberInputChange('system', 'logRetention', e.target.value)} />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="automaticUpdates">Automatic Updates</Label>
              <Switch id="automaticUpdates" checked={settings.system.automaticUpdates} onCheckedChange={(checked) => handleToggleChange('system', 'automaticUpdates', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Switch id="maintenanceMode" checked={settings.system.maintenanceMode} onCheckedChange={(checked) => handleToggleChange('system', 'maintenanceMode', checked)} />
            </div>
             <Button variant="outline" className="mt-2" onClick={handleDatabaseMaintenance}>Database Maintenance</Button>
           </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="lg:col-span-3"> {/* Span across 3 columns on large screens */}
           <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5 text-primary" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Service */}
            <div>
              <h4 className="text-md font-medium mb-2">Email Service</h4>
               <div className="flex items-center justify-between mb-4">
                <Label htmlFor="enableEmail">Enable Email</Label>
                <Switch id="enableEmail" checked={settings.integrations.emailService.enableEmail} onCheckedChange={(checked) => handleToggleChange('integrations', 'emailService', { ...settings.integrations.emailService, enableEmail: checked })} />
              </div>
              <div className="grid gap-2">
                 <div>
                   <Label htmlFor="smtpServer">SMTP Server</Label>
                   <Input id="smtpServer" value={settings.integrations.emailService.smtpServer} onChange={(e) => handleInputChange('integrations', 'emailService', { ...settings.integrations.emailService, smtpServer: e.target.value })} />
                 </div>
                 <div>
                   <Label htmlFor="smtpPort">Port</Label>
                   <Input id="smtpPort" type="number" value={settings.integrations.emailService.port || ''} onChange={(e) => handleNumberInputChange('integrations', 'emailService', { ...settings.integrations.emailService, port: e.target.value === '' ? null : Number(e.target.value) })} />
                 </div>
              </div>
            </div>

             {/* Payment Gateway */}
            <div>
              <h4 className="text-md font-medium mb-2">Payment Gateway</h4>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="enablePayments">Enable Payments</Label>
                <Switch id="enablePayments" checked={settings.integrations.paymentGateway.enablePayments} onCheckedChange={(checked) => handleToggleChange('integrations', 'paymentGateway', { ...settings.integrations.paymentGateway, enablePayments: checked })} />
              </div>
              <div className="grid gap-2">
                 <div>
                    <Label htmlFor="paymentProvider">Provider</Label>
                    <Select value={settings.integrations.paymentGateway.provider} onValueChange={(value) => handleSelectChange('integrations', 'paymentGateway', { ...settings.integrations.paymentGateway, provider: value })}>
                      <SelectTrigger id="paymentProvider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                         {/* Add more providers */}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

             {/* API Settings */}
            <div>
              <h4 className="text-md font-medium mb-2">API Settings</h4>
               <div className="flex items-center justify-between mb-4">
                <Label htmlFor="enableApi">Enable API</Label>
                <Switch id="enableApi" checked={settings.integrations.apiSettings.enableApi} onCheckedChange={(checked) => handleToggleChange('integrations', 'apiSettings', { ...settings.integrations.apiSettings, enableApi: checked })} />
              </div>
               <div className="grid gap-2">
                 <div>
                    <Label htmlFor="rateLimit">Rate Limit (req/min)</Label>
                    <Input id="rateLimit" type="number" value={settings.integrations.apiSettings.rateLimit} onChange={(e) => handleNumberInputChange('integrations', 'apiSettings', { ...settings.integrations.apiSettings, rateLimit: Number(e.target.value) })} />
                 </div>
                 <Button variant="outline" className="mt-2" onClick={handleGenerateApiKey}>Generate API Key</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
