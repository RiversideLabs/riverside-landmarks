#!/usr/bin/env node

var IOS_DEPLOYMENT_TARGET = '7.0';
var IOS_DEPLOYMENT_DEVICE = '1'; // 1 for iPhone; 2 for iPad; 1,2 for universal

var fs = require("fs"),
    path = require("path"),
    shell = require("shelljs"),
    xcode = require('xcode'),
    projectRoot = process.argv[2];

function propReplace(obj, prop, value) {
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      if (typeof obj[p] === 'object') {
        propReplace(obj[p], prop, value);
      } else if (p === prop) {
        obj[p] = value;
      }
    }
  }
}

function updateDeploymentTarget(xcodeProject, xcodeProjectPath, targetVersion){
  var buildConfig = xcodeProject.pbxXCBuildConfigurationSection();
  propReplace(buildConfig, 'IPHONEOS_DEPLOYMENT_TARGET', targetVersion);
  fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync(), 'utf-8');
}

function updateDeploymentDevice(xcodeProject, xcodeProjectPath, targetDevice){
  var buildConfig = xcodeProject.pbxXCBuildConfigurationSection();
  propReplace(buildConfig, 'TARGETED_DEVICE_FAMILY', targetDevice);
  fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync(), 'utf-8');
}

function getProjectName(protoPath){
  var cordovaConfigPath = path.join(protoPath, '.cordova', 'config.json'),
      content = fs.readFileSync(cordovaConfigPath, 'utf-8'),
      json = JSON.parse(content);

  return json.name;
}

/*
  This is our runner function. It sets up the project paths,
  parses the project file using xcode and delegates to our updateDeploymentTarget
  that does the actual work.
*/

function run(projectRoot){
  var projectName = getProjectName(projectRoot),
      xcodeProjectName = projectName + '.xcodeproj',
      xcodeProjectPath = path.join(projectRoot, 'platforms', 'ios', xcodeProjectName, 'project.pbxproj'),
      xcodeProject;

  if(!fs.existsSync(xcodeProjectPath)) { return; }

  xcodeProject = xcode.project(xcodeProjectPath);

  shell.echo("Adjusting iOS deployment target for " + projectName + " to: [" + IOS_DEPLOYMENT_TARGET + "] ...");

  xcodeProject.parse(function(err){
    if(err){
      shell.echo('An error occured during parsing of [' + xcodeProjectPath + ']: ' + JSON.stringify(err));
    }else{
      updateDeploymentTarget(xcodeProject, xcodeProjectPath, IOS_DEPLOYMENT_TARGET);
      updateDeploymentDevice(xcodeProject, xcodeProjectPath, IOS_DEPLOYMENT_DEVICE);
      shell.echo('[' + xcodeProjectPath + '] now has deployment target set as:[' + IOS_DEPLOYMENT_TARGET + '] ...');
      shell.echo('[' + xcodeProjectPath + '] now has deployment device set as:[' + IOS_DEPLOYMENT_DEVICE + '] ...');
    }
  });
}

run(projectRoot);
